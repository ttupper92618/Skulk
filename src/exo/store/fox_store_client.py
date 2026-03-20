# pyright: reportAny=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false
"""
FoxStoreClient — HTTP client for staging model shards from the store host.

FoxShardDownloader — ShardDownloader implementation that intercepts
ensure_shard() and stages from the store instead of HuggingFace.

Key design decisions:
- When the current node IS the store host, shutil.copy2 is used instead
  of HTTP to avoid a pointless loopback round-trip.
- Resume support: .partial files are used, Range headers are sent on retry.
- FoxShardDownloader wraps any inner ShardDownloader (normally the EXO
  ResumableShardDownloader) and falls back to it when the model is not
  in the store and allow_hf_fallback is True.
"""
from __future__ import annotations

import shutil
from collections.abc import Awaitable
from datetime import timedelta
from pathlib import Path
from typing import AsyncIterator, Callable, final

import aiofiles
import aiofiles.os as aios
import aiohttp
from loguru import logger

from exo.download.download_utils import create_http_session
from exo.download.shard_downloader import ShardDownloader
from exo.shared.types.memory import Memory
from exo.shared.types.worker.downloads import RepoDownloadProgress
from exo.shared.types.worker.shards import ShardMetadata
from exo.store.config import StagingNodeConfig

_CHUNK_SIZE = 8 * 1024 * 1024  # 8 MB
_CONNECT_TIMEOUT = 10.0
_READ_TIMEOUT = 120.0


class StoreModelNotFoundError(Exception):
    """Raised when a model is not in the store and HF fallback is disabled."""


def _sanitize_model_id(model_id: str) -> str:
    """Convert model_id to a safe local directory name (matches EXO convention)."""
    return str(model_id).replace("/", "--")


def _staging_dir(node_cache_path: str, model_id: str) -> Path:
    return Path(node_cache_path).expanduser() / _sanitize_model_id(model_id)


def _make_store_url(host: str, port: int, path: str) -> str:
    return f"http://{host}:{port}{path}"


@final
class StoreHealthInfo:
    """Health response from FoxStoreServer."""

    def __init__(
        self, store_path: str, free_bytes: int, total_bytes: int, used_bytes: int
    ) -> None:
        self.store_path = store_path
        self.free_bytes = free_bytes
        self.total_bytes = total_bytes
        self.used_bytes = used_bytes


@final
class FoxStoreClient:
    """HTTP client for staging model shards from a FoxStoreServer.

    When local_store_path is set (i.e. this node IS the store host),
    file copies bypass HTTP entirely and use shutil.copy2().
    """

    def __init__(
        self,
        store_host: str,
        store_port: int = 58080,
        local_store_path: Path | None = None,
    ) -> None:
        self._store_host = store_host
        self._store_port = store_port
        self._local_store_path = local_store_path

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def health_check(self) -> StoreHealthInfo | None:
        """Return health info from the store server, or None if unreachable."""
        url = _make_store_url(self._store_host, self._store_port, "/health")
        try:
            async with (
                create_http_session(timeout_profile="short") as session,
                session.get(url) as resp,
            ):
                if resp.status != 200:
                    return None
                data: object = await resp.json()
                if not isinstance(data, dict):
                    return None
                return StoreHealthInfo(
                    store_path=str(data.get("store_path", "")),
                    free_bytes=int(data.get("free_bytes", 0)),
                    total_bytes=int(data.get("total_bytes", 0)),
                    used_bytes=int(data.get("used_bytes", 0)),
                )
        except Exception as exc:
            logger.debug(f"FoxStoreClient: health_check failed: {exc}")
            return None

    async def is_model_available(self, model_id: str) -> bool:
        """Return True if the model is present in the store (via HTTP query)."""
        url = _make_store_url(
            self._store_host,
            self._store_port,
            f"/models/{model_id}/files",
        )
        try:
            async with (
                create_http_session(timeout_profile="short") as session,
                session.get(url) as resp,
            ):
                return resp.status == 200
        except Exception:
            return False

    async def stage_shard(
        self,
        model_id: str,
        dest_path: Path,
        on_progress: Callable[
            [int, int], Awaitable[None]
        ]
        | None = None,
    ) -> Path:
        """Copy model files from the store to dest_path.

        Uses local copy (shutil) if this node is the store host,
        otherwise fetches via HTTP with range request resume support.

        Args:
            model_id: HuggingFace-style model ID (e.g. "mlx-community/Qwen3-30B-A3B-4bit")
            dest_path: Directory to stage files into
            on_progress: Optional callback(bytes_staged, total_bytes)

        Returns:
            dest_path after staging is complete
        """
        await aios.makedirs(dest_path, exist_ok=True)

        if self._local_store_path is not None:
            return await self._stage_local(
                model_id, dest_path, on_progress
            )
        return await self._stage_http(model_id, dest_path, on_progress)

    async def evict_shard(self, model_id: str, cache_path: Path) -> None:
        """Remove staged model files from the node-local cache.

        The canonical copy in the store is never touched.

        Args:
            model_id: Model whose staged files to remove
            cache_path: Root of the node-local staging directory
        """
        staged_dir = cache_path / _sanitize_model_id(model_id)
        if not staged_dir.exists():
            logger.debug(
                f"FoxStoreClient: evict_shard — no staged files for {model_id}"
            )
            return
        try:
            shutil.rmtree(staged_dir)
            logger.info(
                f"FoxStoreClient: evicted staged shard for {model_id} "
                f"from {staged_dir}"
            )
        except Exception as exc:
            logger.warning(
                f"FoxStoreClient: evict_shard failed for {model_id}: {exc}"
            )

    async def list_models(self) -> list[str]:
        """Return list of model IDs available in the store."""
        url = _make_store_url(self._store_host, self._store_port, "/models")
        try:
            async with (
                create_http_session(timeout_profile="short") as session,
                session.get(url) as resp,
            ):
                if resp.status != 200:
                    return []
                data: object = await resp.json()
                if not isinstance(data, list):
                    return []
                return [str(item) for item in data if isinstance(item, str)]
        except Exception as exc:
            logger.debug(f"FoxStoreClient: list_models failed: {exc}")
            return []

    # ------------------------------------------------------------------
    # Local copy path (store host → same node)
    # ------------------------------------------------------------------

    async def _stage_local(
        self,
        model_id: str,
        dest_path: Path,
        on_progress: Callable[[int, int], Awaitable[None]] | None,
    ) -> Path:
        assert self._local_store_path is not None
        source_dir = self._local_store_path / _sanitize_model_id(model_id)
        if not source_dir.exists():
            raise StoreModelNotFoundError(
                f"Model {model_id} not found in local store at {source_dir}"
            )

        files = [p for p in source_dir.rglob("*") if p.is_file()]
        total_bytes = sum(p.stat().st_size for p in files)
        staged_bytes = 0

        for src_file in files:
            rel = src_file.relative_to(source_dir)
            dst_file = dest_path / rel
            dst_file.parent.mkdir(parents=True, exist_ok=True)
            if not dst_file.exists() or dst_file.stat().st_size != src_file.stat().st_size:
                shutil.copy2(src_file, dst_file)
            staged_bytes += src_file.stat().st_size
            if on_progress is not None:
                await on_progress(staged_bytes, total_bytes)

        logger.info(
            f"FoxStoreClient: staged {model_id} locally to {dest_path} "
            f"({total_bytes} bytes)"
        )
        return dest_path

    # ------------------------------------------------------------------
    # HTTP staging path (worker node → store host via HTTP)
    # ------------------------------------------------------------------

    async def _fetch_file_list(self, model_id: str) -> list[str]:
        """Fetch the file list for model_id from the store server."""
        url = _make_store_url(
            self._store_host,
            self._store_port,
            f"/models/{model_id}/files",
        )
        async with (
            create_http_session(timeout_profile="short") as session,
            session.get(url) as resp,
        ):
            if resp.status == 404:
                raise StoreModelNotFoundError(
                    f"Model {model_id} not found in store"
                )
            if resp.status != 200:
                raise RuntimeError(
                    f"FoxStoreClient: /models/{model_id}/files returned {resp.status}"
                )
            data: object = await resp.json()
            if not isinstance(data, list):
                raise RuntimeError(
                    "FoxStoreClient: unexpected file list response type"
                )
            return [str(item) for item in data if isinstance(item, str)]

    async def _download_store_file(
        self,
        model_id: str,
        file_path: str,
        dest_path: Path,
        on_progress: Callable[[int, int], Awaitable[None]] | None,
        total_bytes_offset: int,
        grand_total: int,
    ) -> int:
        """Download a single file from the store to dest_path/file_path.

        Returns the number of bytes downloaded (for progress accumulation).
        """
        target = dest_path / file_path
        target.parent.mkdir(parents=True, exist_ok=True)
        partial = dest_path / f"{file_path}.partial"

        url = _make_store_url(
            self._store_host,
            self._store_port,
            f"/models/{model_id}/{file_path}",
        )

        # Check if already complete
        if target.exists():
            file_size = target.stat().st_size
            return file_size

        # Resume from partial if present
        resume_from = partial.stat().st_size if partial.exists() else 0

        headers: dict[str, str] = {}
        if resume_from > 0:
            headers["Range"] = f"bytes={resume_from}-"

        timeout = aiohttp.ClientTimeout(
            total=3600, connect=_CONNECT_TIMEOUT, sock_read=_READ_TIMEOUT
        )
        async with (
            aiohttp.ClientSession(timeout=timeout) as session,
            session.get(url, headers=headers) as resp,
        ):
            if resp.status == 404:
                raise StoreModelNotFoundError(
                    f"File not found in store: {model_id}/{file_path}"
                )
            if resp.status not in (200, 206):
                raise RuntimeError(
                    f"FoxStoreClient: GET {url} returned {resp.status}"
                )

            n_read = resume_from
            async with aiofiles.open(
                partial, "ab" if resume_from > 0 else "wb"
            ) as f:
                async for chunk in resp.content.iter_chunked(_CHUNK_SIZE):
                    await f.write(chunk)
                    n_read += len(chunk)
                    if on_progress is not None:
                        await on_progress(
                            total_bytes_offset + n_read, grand_total
                        )

        await aios.rename(partial, target)
        return n_read

    async def _stage_http(
        self,
        model_id: str,
        dest_path: Path,
        on_progress: Callable[[int, int], Awaitable[None]] | None,
    ) -> Path:
        file_list = await self._fetch_file_list(model_id)

        # Compute total size by checking what's already staged
        # (we can't get remote sizes without a HEAD per file, so skip for now)
        grand_total = 0
        staged_offset = 0

        for file_path in file_list:
            target = dest_path / file_path
            if target.exists():
                size = target.stat().st_size
                grand_total += size
                staged_offset += size

        # Download files sequentially (parallel would require size pre-fetch)
        bytes_done = staged_offset
        for file_path in file_list:
            target = dest_path / file_path
            if target.exists():
                continue
            file_bytes = await self._download_store_file(
                model_id,
                file_path,
                dest_path,
                on_progress,
                total_bytes_offset=bytes_done,
                grand_total=max(grand_total, 1),
            )
            bytes_done += file_bytes

        logger.info(
            f"FoxStoreClient: staged {model_id} to {dest_path} "
            f"({bytes_done} bytes)"
        )
        return dest_path


# ---------------------------------------------------------------------------
# FoxShardDownloader — ShardDownloader wrapper
# ---------------------------------------------------------------------------


@final
class FoxShardDownloader(ShardDownloader):
    """ShardDownloader that intercepts ensure_shard() for store-staged models.

    Consistent with SingletonShardDownloader wrapping ResumableShardDownloader:
    this wraps any inner ShardDownloader and only falls through to it when
    the model is not in the store (or when allow_hf_fallback is True).
    """

    def __init__(
        self,
        inner: ShardDownloader,
        store_client: FoxStoreClient,
        staging_config: StagingNodeConfig,
        allow_hf_fallback: bool = True,
    ) -> None:
        self._inner = inner
        self._store_client = store_client
        self._staging_config = staging_config
        self._allow_hf_fallback = allow_hf_fallback
        self._on_progress_callbacks: list[
            Callable[[ShardMetadata, RepoDownloadProgress], Awaitable[None]]
        ] = []

    def on_progress(
        self,
        callback: Callable[[ShardMetadata, RepoDownloadProgress], Awaitable[None]],
    ) -> None:
        self._on_progress_callbacks.append(callback)
        self._inner.on_progress(callback)

    async def ensure_shard(
        self, shard: ShardMetadata, config_only: bool = False
    ) -> Path:
        model_id = str(shard.model_card.model_id)

        if not self._staging_config.enabled:
            return await self._inner.ensure_shard(shard, config_only)

        available = await self._store_client.is_model_available(model_id)

        if available:
            dest_path = _staging_dir(
                self._staging_config.node_cache_path, model_id
            )
            logger.info(
                f"FoxShardDownloader: staging {model_id} from store → {dest_path}"
            )
            await self._emit_progress(shard, status="in_progress")
            try:
                path = await self._store_client.stage_shard(
                    model_id,
                    dest_path,
                    on_progress=None,
                )
                await self._emit_progress(shard, status="complete")
                return path
            except StoreModelNotFoundError:
                logger.warning(
                    f"FoxShardDownloader: store reported {model_id} available "
                    "but staging failed — falling back"
                )
                # Fall through to HF path below

        if self._allow_hf_fallback:
            logger.info(
                f"FoxShardDownloader: {model_id} not in store, falling back to HF"
            )
            return await self._inner.ensure_shard(shard, config_only)

        raise StoreModelNotFoundError(
            f"Model {model_id} is not in the store and HF fallback is disabled"
        )

    async def get_shard_download_status(
        self,
    ) -> AsyncIterator[tuple[Path, RepoDownloadProgress]]:
        async for item in self._inner.get_shard_download_status():
            yield item

    async def get_shard_download_status_for_shard(
        self, shard: ShardMetadata
    ) -> RepoDownloadProgress:
        return await self._inner.get_shard_download_status_for_shard(shard)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _emit_progress(
        self,
        shard: ShardMetadata,
        status: str,
    ) -> None:
        """Emit a basic RepoDownloadProgress event to all registered callbacks."""
        progress = RepoDownloadProgress(
            repo_id=str(shard.model_card.model_id),
            repo_revision="store",
            shard=shard,
            completed_files=0,
            total_files=1,
            downloaded=Memory.from_bytes(0),
            downloaded_this_session=Memory.from_bytes(0),
            total=shard.model_card.storage_size,
            overall_speed=0.0,
            overall_eta=timedelta(seconds=0),
            status="in_progress" if status == "in_progress" else "complete",
        )
        for cb in self._on_progress_callbacks:
            await cb(shard, progress)
