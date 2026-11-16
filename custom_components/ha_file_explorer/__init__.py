"""File Explorer for Home Assistant.

The integration registers a native Home Assistant custom panel. The panel is
loaded as an ES module inside the main HA document (no iframe), so it inherits
the active HA theme automatically.
"""
from __future__ import annotations

from pathlib import Path

from homeassistant.components.frontend import (
    async_register_built_in_panel,
    async_remove_panel,
)
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .http_api import MAX_UPLOAD_SIZE, HttpApi
from .manifest import manifest

DOMAIN = manifest.domain
NAME = manifest.name
CONFIG_SCHEMA = cv.deprecated(DOMAIN)

PANEL_TAG = "ha-file-explorer-panel"
WWW_DIR = Path(__file__).parent / "www"

# A versioned prefix changes every module URL when the integration is upgraded,
# so browsers never reuse a stale cached copy of the panel.
STATIC_URL_PATH = f"/{DOMAIN}-assets/{manifest.version}"
PANEL_MODULE_URL = f"{STATIC_URL_PATH}/ha-file-explorer.js"
HTTP_READY_KEY = f"{DOMAIN}_http_ready"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register the static panel modules and the HTTP API once."""
    if hass.data.get(HTTP_READY_KEY):
        return True

    await hass.http.async_register_static_paths(
        [StaticPathConfig(STATIC_URL_PATH, str(WWW_DIR), False)]
    )
    hass.http.register_view(HttpApi)
    # aiohttp copies this limit into every new request; HA defaults to 16 MB.
    hass.http.app._client_max_size = MAX_UPLOAD_SIZE
    hass.data[HTTP_READY_KEY] = True
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Register the file explorer as a native HA custom panel."""
    async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title=NAME,
        sidebar_icon="mdi:folder",
        frontend_url_path=DOMAIN,
        config={
            "version": manifest.version,
            "documentation": manifest.documentation,
            "_panel_custom": {
                "name": PANEL_TAG,
                "module_url": PANEL_MODULE_URL,
                "embed_iframe": False,
                "trust_external": False,
            },
        },
        require_admin=entry.data.get("require_admin", False),
        update=True,
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove the panel when the config entry is unloaded."""
    async_remove_panel(hass, DOMAIN)
    return True
