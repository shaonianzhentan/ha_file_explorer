import requests, os
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

from .file_api import get_current_path, download
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
        return '''
        - 支持新增文件和文件夹
        '''

    async def async_install(self, version: str, backup: bool):
        # self._attr_in_progress = True
        # download install script
        url = 'https://gitee.com/shaonianzhentan/ha_file_explorer/raw/dev/bash/install.sh'
        sh_file = get_current_path('install.sh')
        await download(url, sh_file)
        os.system('sh ' + sh_file)
        self._attr_title = '需要重启 Home Assistant'
        manifest.update()

    async def async_update(self):
        res = await self.hass.async_add_executor_job(requests.get, (manifest.remote_url))
        data = res.json()
        self._attr_latest_version = data.get('version')