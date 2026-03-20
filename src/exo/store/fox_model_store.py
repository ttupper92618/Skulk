# pyright: reportAny=false, reportUnknownVariableType=false, reportUnknownMemberType=false
"""
FoxModelStore — centralized model registry and path resolution.

Runs only on the store host node. Worker nodes interact with the store
exclusively via FoxStoreClient (HTTP).
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import final

from loguru import logger
from pydantic import BaseModel, ConfigDict


@final
class StoreModelEntry(BaseModel):
    """Metadata for a single model in the store registry."""

    model_config = ConfigDict(frozen=True, strict=True, extra="forbid")

    model_id: str
    # Path relative to store root (e.g. "mlx-community--Qwen3-30B-A3B-4bit")
    store_path: str
    # All file paths relative to the model directory
    files: list[str]
    downloaded_at: str
    total_bytes: int


@final
class FoxModelStore:
    """Manages the model registry on the store host.

    The registry is a JSON file at ``{store_path}/registry.json``.
    It maps model_id → StoreModelEntry.

    All registry I/O is synchronous (called from async contexts via
    anyio.to_thread.run_sync where blocking matters).
    """

    def __init__(self, store_path: Path) -> None:
        self._store_path = store_path
        self._registry_path = store_path / "registry.json"

    @property
    def store_path(self) -> Path:
        return self._store_path

    def is_in_store(self, model_id: str) -> bool:
        """Return True if the model is present in the store and its directory exists."""
        return self.get_store_path(model_id) is not None

    def get_store_path(self, model_id: str) -> Path | None:
        """Return the local path to the model directory, or None if absent."""
        registry = self._read_registry()
        entry = registry.get(model_id)
        if entry is None:
            return None
        model_path = self._store_path / entry.store_path
        if not model_path.exists():
            return None
        return model_path

    def list_models(self) -> list[StoreModelEntry]:
        """Return all models currently in the store."""
        return list(self._read_registry().values())

    def register_model(
        self,
        model_id: str,
        model_path: Path,
        files: list[str],
        total_bytes: int,
    ) -> None:
        """Add or update a model entry in the registry."""
        relative_path = str(model_path.relative_to(self._store_path))
        entry = StoreModelEntry(
            model_id=model_id,
            store_path=relative_path,
            files=files,
            downloaded_at=datetime.now(tz=timezone.utc).isoformat(),
            total_bytes=total_bytes,
        )
        self._write_registry_entry(entry)
        logger.info(
            f"FoxModelStore: registered {model_id} at {relative_path} "
            f"({total_bytes} bytes, {len(files)} files)"
        )

    def list_files_for_model(self, model_id: str) -> list[str] | None:
        """Return the file list for a model, or None if not in registry."""
        registry = self._read_registry()
        entry = registry.get(model_id)
        if entry is None:
            return None
        return entry.files

    # ------------------------------------------------------------------
    # Registry I/O (synchronous)
    # ------------------------------------------------------------------

    def _read_registry(self) -> dict[str, StoreModelEntry]:
        if not self._registry_path.exists():
            return {}
        try:
            data: object = json.loads(self._registry_path.read_text())
            if not isinstance(data, dict):
                logger.warning("FoxModelStore: registry.json is not a dict, resetting")
                return {}
            return {
                k: StoreModelEntry.model_validate(v)
                for k, v in data.items()
                if isinstance(k, str)
            }
        except Exception as exc:
            logger.warning(f"FoxModelStore: failed to read registry: {exc}")
            return {}

    def _write_registry_entry(self, entry: StoreModelEntry) -> None:
        self._store_path.mkdir(parents=True, exist_ok=True)
        registry = self._read_registry()
        registry[entry.model_id] = entry
        self._registry_path.write_text(
            json.dumps(
                {k: v.model_dump() for k, v in registry.items()},
                indent=2,
            )
        )
