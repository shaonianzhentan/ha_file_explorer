from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
import homeassistant.helpers.config_validation as cv
from homeassistant.components.frontend import async_register_built_in_panel, async_remove_panel
from homeassistant.components.http import StaticPathConfig
from .http_api import HttpApi
from .manifest import manifest

DOMAIN = manifest.domain
NAME = manifest.name
CONFIG_SCHEMA = cv.deprecated(DOMAIN)

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    entry_id = entry.entry_id
    url_path = f'/{entry_id}-local'
    await hass.http.async_register_static_paths(
        [ StaticPathConfig(url_path, hass.config.path("custom_components/" + DOMAIN + "/www"), False) ]
    )

    async_register_built_in_panel(
        hass,
        "iframe",
        sidebar_title=NAME,
        sidebar_icon="mdi:folder",
        frontend_url_path=DOMAIN,
        config={"url": f"{url_path}/index.html?v={manifest.version}"},
        require_admin=entry.data.get("require_admin", False),
    )

    hass.http.register_view(HttpApi)
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    async_remove_panel(DOMAIN)
    return True