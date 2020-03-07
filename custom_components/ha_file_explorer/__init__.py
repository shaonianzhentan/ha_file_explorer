import os, yaml, uuid, logging, time, importlib, base64, json, string, sys
from aiohttp import web
import voluptuous as vol
from homeassistant.components.weblink import Link
from homeassistant.components.http import HomeAssistantView
from homeassistant.helpers import config_validation as cv, intent
from homeassistant import config as conf_util, loader

from .api import FileExplorer

_LOGGER = logging.getLogger(__name__)

DOMAIN = 'ha_file_explorer'
VERSION = '1.6'
URL = '/' + DOMAIN +'-api-' + VERSION
ROOT_PATH = '/' + DOMAIN +'-local/' + VERSION

def setup(hass, config):        
    cfg  = config[DOMAIN]
    sidebar_title = cfg.get('sidebar_title', '文件管理')
    sidebar_icon = cfg.get('sidebar_icon', 'mdi:folder')

    # 重新加载服务
    if hass.services.has_service(DOMAIN, 'reload') == False:
        async def reload(call):
            integration = await loader.async_get_integration(hass, DOMAIN)
            component = integration.get_component()
            importlib.reload(component)
            config = await conf_util.async_hass_config_yaml(hass)
            component.setup(hass, config)
            _LOGGER.info('重新加载成功')

        hass.services.register(DOMAIN, 'reload', reload)
    else:
        # 重新加载模块
        importlib.reload(sys.modules['custom_components.ha_file_explorer.qn'])
        importlib.reload(sys.modules['custom_components.ha_file_explorer.api'])

    hass.data[DOMAIN] = FileExplorer(hass,cfg)
    
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
        _type = res['type']
        _path = hass.config.path('./' + res.get('path', ''))
        if _type == 'get':
            _json = fileExplorer.getDirectory(_path)
            return self.json(_json)
        elif _type == 'content':
            try:
                _text = fileExplorer.getContent(_path)
                return self.json({ 'code': 0, 'data': _text})
            except Exception as ex:
                return self.json({'code': 1, 'msg': '出现异常'})
        elif _type == 'set':
            fileExplorer.setContent(_path, res['data'])
            return self.json({ 'code': 0, 'msg': '保存成功'})
        elif _type == 'delete':
            # 这是过滤掉主文件，不让删除
            fileExplorer.delete(_path)
            return self.json({ 'code': 0, 'msg': '删除成功'})
        elif _type == 'new':
            filename = res['newFile']
            fileExplorer.setContent(_path + '/' + filename, '')
            return self.json({ 'code': 0, 'msg': '新建成功'})
        elif _type == 'upload':
            if fileExplorer.q is None:
                return self.json({ 'code': 1, 'msg': '请配置七牛云相关密钥信息'})
            
            if 'path' in res:
                zf = fileExplorer.zipdir(res['path'])
            elif 'list' in res:
                # 压缩多个文件
                zf = fileExplorer.zip(res['list'])
            
            fileExplorer.q.upload(zf)
            # 上传成功，删除文件
            fileExplorer.delete(zf)
            return self.json({ 'code': 0, 'msg': '上传成功'})
        elif _type == 'upload-list':
            res = fileExplorer.q.get_list()
            return self.json({ 'code': 0, 'msg': '上传成功', 'data': res})
        elif _type == 'reload':
            integration = await loader.async_get_integration(hass, DOMAIN)
            component = integration.get_component()
            importlib.reload(component)
            config = await conf_util.async_hass_config_yaml(hass)
            component.setup(hass, config)
            return self.json({'code':0, 'msg': '重新加载成功'})
        return self.json(res)

