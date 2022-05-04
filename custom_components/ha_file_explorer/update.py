import subprocess
from homeassistant.components.update import (
    UpdateDeviceClass,
    UpdateEntity,
    UpdateEntityDescription,
    UpdateEntityFeature
)

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import VERSION, NAME
from .file_api import get_current_path

async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    async_add_entities([EntityUpdate(entry.entry_id)])

class EntityUpdate(UpdateEntity):

    _attr_supported_features = UpdateEntityFeature.INSTALL | UpdateEntityFeature.RELEASE_NOTES
    _attr_name = NAME
    _attr_title = NAME

    def __init__(self, unique_id):
        self._attr_unique_id = unique_id
        self._attr_release_url = 'https://github.com/shaonianzhentan/ha_file_explorer'
        self.update()

    @property
    def installed_version(self):
        return VERSION

    async def async_release_notes(self):
        return "Lorem ipsum"

    async def async_install(self, version: str, backup: bool):
        print(self._attr_in_progress)
        if self._attr_in_progress != True:
            self._attr_in_progress = True
        sh_file = get_current_path('install.sh')
        subprocess.Popen('sh ' + sh_file, shell=True)

    def update(self):
        self._attr_latest_version = '3.0.3'

    async def async_update(self):
        print('update')
        self._attr_latest_version = '3.0.3'