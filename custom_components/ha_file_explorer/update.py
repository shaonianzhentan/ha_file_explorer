import subprocess, requests
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

from .file_api import get_current_path
from .manifest import manifest

NAME = manifest.name

async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    ent = EntityUpdate(hass, entry.entry_id)
    await ent.async_update()
    async_add_entities([ ent ])

class EntityUpdate(UpdateEntity):

    _attr_supported_features = UpdateEntityFeature.INSTALL | UpdateEntityFeature.RELEASE_NOTES
    _attr_name = NAME
    _attr_title = NAME

    def __init__(self, hass, unique_id):
        self.hass = hass
        self._attr_unique_id = unique_id
        self._attr_release_url = 'https://github.com/shaonianzhentan/ha_file_explorer'

    @property
    def installed_version(self):
        return manifest.version

    async def async_release_notes(self):
        return "Lorem ipsum"

    async def async_install(self, version: str, backup: bool):
        print(self._attr_in_progress)
        if self._attr_in_progress != True:
            self._attr_in_progress = True
        sh_file = get_current_path('install.sh')
        subprocess.Popen('sh ' + sh_file, shell=True)

    async def async_update(self):
        res = await self.hass.async_add_executor_job(requests.get, (manifest.remote_url))
        data = res.json()
        self._attr_latest_version = data.get('version')