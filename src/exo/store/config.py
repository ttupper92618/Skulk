# pyright: reportAny=false
"""
Configuration schema for foxcluster.yaml.

Place foxcluster.yaml alongside the project root. If absent, foxcluster
behaves identically to upstream EXO (zero-config compatibility).
"""
from __future__ import annotations

from pathlib import Path
from typing import final

import yaml

from exo.utils.pydantic_ext import FrozenModel


@final
class StagingNodeConfig(FrozenModel):
    """Per-node staging configuration."""

    enabled: bool = True
    node_cache_path: str = "~/.foxcluster/stage"
    cleanup_on_deactivate: bool = True


@final
class DownloadStoreConfig(FrozenModel):
    """Download policy configuration."""

    allow_hf_fallback: bool = True


@final
class NodeOverrideConfig(FrozenModel):
    """Per-node config overrides (matched by hostname or node_id)."""

    staging: StagingNodeConfig | None = None


@final
class ModelStoreConfig(FrozenModel):
    """Top-level model store configuration block."""

    enabled: bool = True
    store_host: str
    store_port: int = 58080
    store_path: str
    download: DownloadStoreConfig = DownloadStoreConfig()
    staging: StagingNodeConfig = StagingNodeConfig()
    node_overrides: dict[str, NodeOverrideConfig] = {}


@final
class FoxClusterConfig(FrozenModel):
    """Root configuration model for foxcluster.yaml."""

    model_store: ModelStoreConfig | None = None


def load_fox_config(
    path: Path = Path("foxcluster.yaml"),
) -> FoxClusterConfig | None:
    """Load foxcluster.yaml. Returns None if the file is absent.

    Zero-config compatibility: all downstream code must check for None
    before using the returned config.
    """
    if not path.exists():
        return None
    with path.open() as f:
        raw = yaml.safe_load(f)
    return FoxClusterConfig.model_validate(raw)


def resolve_node_staging(
    config: ModelStoreConfig, node_id: str
) -> StagingNodeConfig:
    """Return the effective staging config for a node.

    Per-node overrides (matched by node_id or hostname) take priority
    over the base staging config.
    """
    override = config.node_overrides.get(node_id)
    if override is not None and override.staging is not None:
        return override.staging
    return config.staging
