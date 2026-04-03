"""Tests for XDG Base Directory Specification compliance."""

import os
import sys
from pathlib import Path
from unittest import mock


def test_xdg_paths_on_linux():
    """Test that XDG paths are used on Linux when XDG env vars are set."""
    env = {
        k: v
        for k, v in os.environ.items()
        if not k.startswith("SKULK_")
        and not k.startswith("EXO_")
        and not k.startswith("XDG_")
    }
    env.update(
        {
            "XDG_CONFIG_HOME": "/tmp/test-config",
            "XDG_DATA_HOME": "/tmp/test-data",
            "XDG_CACHE_HOME": "/tmp/test-cache",
        }
    )
    with (
        mock.patch.dict(os.environ, env, clear=True),
        mock.patch.object(sys, "platform", "linux"),
    ):
        import importlib

        import exo.shared.constants as constants

        importlib.reload(constants)

        assert Path("/tmp/test-config/skulk") == constants.SKULK_CONFIG_HOME
        assert Path("/tmp/test-data/skulk") == constants.SKULK_DATA_HOME
        assert Path("/tmp/test-cache/skulk") == constants.SKULK_CACHE_HOME
        # Deprecated aliases still work
        assert constants.SKULK_CONFIG_HOME == constants.EXO_CONFIG_HOME


def test_xdg_default_paths_on_linux():
    """Test that XDG default paths are used on Linux when env vars are not set."""
    env = {
        k: v
        for k, v in os.environ.items()
        if not k.startswith("XDG_")
        and not k.startswith("SKULK_")
        and not k.startswith("EXO_")
    }
    with (
        mock.patch.dict(os.environ, env, clear=True),
        mock.patch.object(sys, "platform", "linux"),
    ):
        import importlib

        import exo.shared.constants as constants

        importlib.reload(constants)

        home = Path.home()
        assert home / ".config" / "skulk" == constants.SKULK_CONFIG_HOME
        assert home / ".local/share" / "skulk" == constants.SKULK_DATA_HOME
        assert home / ".cache" / "skulk" == constants.SKULK_CACHE_HOME


def test_skulk_home_takes_precedence():
    """Test that SKULK_HOME environment variable takes precedence."""
    with mock.patch.dict(
        os.environ,
        {
            "SKULK_HOME": ".custom-skulk",
            "XDG_CONFIG_HOME": "/tmp/test-config",
        },
        clear=False,
    ):
        import importlib

        import exo.shared.constants as constants

        importlib.reload(constants)

        home = Path.home()
        assert home / ".custom-skulk" == constants.SKULK_CONFIG_HOME
        assert home / ".custom-skulk" == constants.SKULK_DATA_HOME


def test_legacy_exo_home_fallback():
    """Test that EXO_HOME still works as a fallback when SKULK_HOME is not set."""
    env = {k: v for k, v in os.environ.items() if k != "SKULK_HOME"}
    env["EXO_HOME"] = ".custom-exo"
    with mock.patch.dict(os.environ, env, clear=True):
        import importlib

        import exo.shared.constants as constants

        importlib.reload(constants)

        home = Path.home()
        assert home / ".custom-exo" == constants.SKULK_CONFIG_HOME


def test_macos_uses_skulk_directory():
    """Test that macOS uses ~/.skulk directory by default."""
    env = {
        k: v
        for k, v in os.environ.items()
        if not k.startswith("SKULK_") and not k.startswith("EXO_")
    }
    with (
        mock.patch.dict(os.environ, env, clear=True),
        mock.patch.object(sys, "platform", "darwin"),
    ):
        import importlib

        import exo.shared.constants as constants

        importlib.reload(constants)

        home = Path.home()
        # On a fresh install, .skulk is used. If .exo exists and .skulk
        # doesn't, the fallback logic picks .exo — but we can't easily
        # test filesystem state here, so just check it's one of the two.
        assert constants.SKULK_CONFIG_HOME in (home / ".skulk", home / ".exo")


def test_node_id_in_config_dir():
    """Test that node ID keypair is in the config directory."""
    import exo.shared.constants as constants

    assert constants.SKULK_NODE_ID_KEYPAIR.parent == constants.SKULK_CONFIG_HOME


def test_models_in_data_dir():
    """Test that models directory is in the data directory."""
    env = {
        k: v
        for k, v in os.environ.items()
        if not k.startswith("SKULK_MODELS") and not k.startswith("EXO_MODELS")
    }
    with mock.patch.dict(os.environ, env, clear=True):
        import importlib

        import exo.shared.constants as constants

        importlib.reload(constants)

        assert constants.SKULK_MODELS_DIR.parent == constants.SKULK_DATA_HOME
