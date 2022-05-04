from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
import homeassistant.helpers.config_validation as cv

from .const import PLATFORMS
from .http_api import HttpApi
from .manifest import manifest

DOMAIN = manifest.domain
NAME = manifest.name
CONFIG_SCHEMA = cv.deprecated(DOMAIN)

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.config_entries.async_setup_platforms(entry, PLATFORMS)
    entry_id = entry.entry_id
    url_path = f'/{entry_id}-local'
    hass.http.register_static_path(url_path, hass.config.path("custom_components/" + DOMAIN + "/www"))

    hass.components.frontend.async_register_built_in_panel("iframe", 
        NAME, "mdi:folder", entry_id, {"url": f'{url_path}/index.html?v={manifest.version}'},
        entry.data.get('require_admin')
    )

    hass.http.register_view(HttpApi)
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.components.frontend.async_remove_panel(entry.entry_id)
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)