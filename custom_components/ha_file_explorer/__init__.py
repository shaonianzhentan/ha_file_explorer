
import os
import logging
import uuid
import base64
import json
import string
from aiohttp import web
import voluptuous as vol
from homeassistant.components.weblink import Link
from homeassistant.components.http import HomeAssistantView
from homeassistant.helpers import config_validation as cv, intent

from .api import FileExplorer

_LOGGER = logging.getLogger(__name__)

DOMAIN = 'ha_file_explorer'
VERSION = '1.3'
URL = '/' + DOMAIN +'-api'
ROOT_PATH = '/' + DOMAIN +'-local/' + VERSION

def setup(hass, config):        
    cfg  = config[DOMAIN]
    sidebar_title = cfg.get('sidebar_title', '文件管理')
    sidebar_icon = cfg.get('sidebar_icon', 'mdi:folder')
    hass.data[DOMAIN] = FileExplorer(hass)
    
    # 注册静态目录
    local = hass.config.path("custom_components/" + DOMAIN + "/local")
    if os.path.isdir(local):
        hass.http.register_static_path(ROOT_PATH, local, False)
    
    hass.http.register_view(HassGateView)

    # 注册菜单栏
    hass.components.frontend.async_register_built_in_panel(
        "iframe",
        sidebar_title,
        sidebar_icon,
        DOMAIN,
        {"url": ROOT_PATH + "/index.html?ver=" + VERSION},
        require_admin=True
    )
    
        # 显示插件信息
    _LOGGER.info('''
-------------------------------------------------------------------

    文件管理插件【作者QQ：635147515】
    
    版本：''' + VERSION + '''    
    
    介绍：在HA里使用的文件管理器
    
    项目地址：https://github.com/shaonianzhentan/ha_file_explorer
    
-------------------------------------------------------------------''')
    return True

class HassGateView(HomeAssistantView):

    url = URL
    name = DOMAIN
    requires_auth = True
    
    async def post(self, request):
        res = await request.json()
        hass = request.app["hass"]
        fileExplorer = hass.data[DOMAIN]
        _path = hass.config.path('./' + res.get('path', ''))
        if res['type'] == 'get':
            _json = fileExplorer.getDirectory(_path)
            return self.json(_json)
        elif res['type'] == 'content':
            try:
                _text = fileExplorer.getContent(_path)
                return self.json({ 'code': 0, 'data': _text})
            except Exception as ex:
                return self.json({'code': 1, 'msg': '出现异常'})
        elif res['type'] == 'set':
            fileExplorer.setContent(_path, res['data'])
            return self.json({ 'code': 0, 'msg': '保存成功'})
        elif res['type'] == 'delete':
            # 这是过滤掉主文件，不让删除
            fileExplorer.delete(_path)
            return self.json({ 'code': 0, 'msg': '删除成功'})
        return self.json(res)

