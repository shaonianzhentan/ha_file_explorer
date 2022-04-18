from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
import homeassistant.helpers.config_validation as cv

from .file_explorer import FileExplorer
from .const import DOMAIN

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data[DOMAIN] = FileExplorer(hass, entry.options, entry.data.get('require_admin', False))
    entry.async_on_unload(entry.add_update_listener(update_listener))
    return True

async def update_listener(hass, entry):
    """Handle options update."""
    config = entry.options
    hass.data[DOMAIN].mounted_qn(config)

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    return True