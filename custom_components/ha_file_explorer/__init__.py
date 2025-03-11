from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
import homeassistant.helpers.config_validation as cv
from homeassistant.components.frontend import async_register_built_in_panel
from homeassistant.components.http import StaticPathConfig
from .http_api import HttpApi, HttpDownloadApi
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

    async_register_built_in_panel(hass, "iframe", 
        NAME, "mdi:folder", entry_id, {"url": f'{url_path}/index.html?v={manifest.version}'},
        entry.data.get('require_admin')
    )

    hass.http.register_view(HttpApi)
    hass.http.register_view(HttpDownloadApi)
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.components.frontend.async_remove_panel(entry.entry_id)
    return True