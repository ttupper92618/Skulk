"""
FoxStoreServer — lightweight aiohttp HTTP server for the store host node.

Serves model files to worker nodes with range request support for
resumable transfers. Runs only on the designated store host.

Endpoints:
    GET /health                        — liveness + disk info
    GET /registry                      — full store index
    GET /models                        — list of model IDs
    GET /models/{model_id}/files       — file list for a model
    GET /models/{model_id}/{path:.*}   — file content (Range-aware)
"""
from __future__ import annotations

import shutil
from typing import final

import aiofiles
import aiofiles.os as aios
import aiohttp.web as web
from loguru import logger

from exo.store.fox_model_store import FoxModelStore

_CHUNK_SIZE = 8 * 1024 * 1024  # 8 MB


def _sanitize_model_id(model_id: str) -> str:
    """URL-decode any %2F in the model_id match (aiohttp leaves them encoded)."""
    return model_id.replace("%2F", "/")


@final
class FoxStoreServer:
    """aiohttp HTTP server that serves model files from the store host."""

    def __init__(
        self,
        store: FoxModelStore,
        host: str = "0.0.0.0",
        port: int = 58080,
    ) -> None:
        self._store = store
        self._host = host
        self._port = port
        self._app = web.Application()
        self._runner: web.AppRunner | None = None
        self._setup_routes()

    def _setup_routes(self) -> None:
        self._app.router.add_get("/health", self._handle_health)
        self._app.router.add_get("/registry", self._handle_registry)
        self._app.router.add_get("/models", self._handle_models)
        self._app.router.add_get(
            "/models/{model_id}/files", self._handle_model_files
        )
        self._app.router.add_get(
            "/models/{model_id}/{path:.*}", self._handle_file
        )

    async def start(self) -> None:
        self._runner = web.AppRunner(self._app)
        await self._runner.setup()
        site = web.TCPSite(self._runner, self._host, self._port)
        await site.start()
        logger.info(
            f"FoxStoreServer listening on {self._host}:{self._port} "
            f"(store: {self._store.store_path})"
        )

    async def stop(self) -> None:
        if self._runner is not None:
            await self._runner.cleanup()
            self._runner = None
            logger.info("FoxStoreServer stopped")

    # ------------------------------------------------------------------
    # Request handlers
    # ------------------------------------------------------------------

    async def _handle_health(self, _request: web.Request) -> web.Response:
        store_path = self._store.store_path
        disk = shutil.disk_usage(store_path)
        return web.json_response(
            {
                "store_path": str(store_path),
                "free_bytes": disk.free,
                "total_bytes": disk.total,
                "used_bytes": disk.used,
            }
        )

    async def _handle_registry(self, _request: web.Request) -> web.Response:
        models = self._store.list_models()
        return web.json_response([m.model_dump() for m in models])

    async def _handle_models(self, _request: web.Request) -> web.Response:
        models = self._store.list_models()
        return web.json_response([m.model_id for m in models])

    async def _handle_model_files(self, request: web.Request) -> web.Response:
        model_id = _sanitize_model_id(request.match_info["model_id"])
        model_path = self._store.get_store_path(model_id)
        if model_path is None:
            raise web.HTTPNotFound(reason=f"Model not in store: {model_id}")
        files = [
            str(p.relative_to(model_path))
            for p in model_path.rglob("*")
            if p.is_file()
        ]
        return web.json_response(files)

    async def _handle_file(self, request: web.Request) -> web.StreamResponse:
        model_id = _sanitize_model_id(request.match_info["model_id"])
        file_rel = request.match_info["path"]

        model_path = self._store.get_store_path(model_id)
        if model_path is None:
            raise web.HTTPNotFound(reason=f"Model not in store: {model_id}")

        # Security: prevent path traversal
        resolved = (model_path / file_rel).resolve()
        if not str(resolved).startswith(str(model_path.resolve())):
            raise web.HTTPBadRequest(reason="Path traversal attempt")

        if not (await aios.path.exists(resolved)) or not (
            await aios.path.isfile(resolved)
        ):
            raise web.HTTPNotFound(reason=f"File not found: {file_rel}")

        file_size = (await aios.stat(resolved)).st_size
        range_header = request.headers.get("Range")

        start = 0
        end = file_size - 1
        status = 200

        if range_header is not None:
            status = 206
            try:
                range_spec = range_header.removeprefix("bytes=")
                start_str, _, end_str = range_spec.partition("-")
                start = int(start_str) if start_str else 0
                end = int(end_str) if end_str else file_size - 1
            except ValueError as exc:
                raise web.HTTPBadRequest(reason="Invalid Range header") from exc

            if start < 0 or end >= file_size or start > end:
                raise web.HTTPRequestRangeNotSatisfiable(
                    headers={"Content-Range": f"bytes */{file_size}"}
                )

        length = end - start + 1
        headers: dict[str, str] = {
            "Content-Length": str(length),
            "Accept-Ranges": "bytes",
            "Content-Type": "application/octet-stream",
        }
        if status == 206:
            headers["Content-Range"] = f"bytes {start}-{end}/{file_size}"

        response = web.StreamResponse(status=status, headers=headers)
        await response.prepare(request)

        async with aiofiles.open(resolved, "rb") as f:
            await f.seek(start)
            remaining = length
            while remaining > 0:
                to_read = min(_CHUNK_SIZE, remaining)
                chunk = await f.read(to_read)
                if not chunk:
                    break
                await response.write(chunk)
                remaining -= len(chunk)

        await response.write_eof()
        return response


