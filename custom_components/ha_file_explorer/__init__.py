import os, yaml, uuid, logging, time, importlib, base64, json, string, sys, requests
from aiohttp import web
import voluptuous as vol
from homeassistant.components.http import HomeAssistantView
from homeassistant.helpers import config_validation as cv, intent
from homeassistant import config as conf_util, loader

from .api import FileExplorer

_LOGGER = logging.getLogger(__name__)

DOMAIN = 'ha_file_explorer'
VERSION = '1.7.7.1'
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
            # 新建文件
            if 'newFile' in res:
                filename = res['newFile']
                fileExplorer.setContent(_path + '/' + filename, '')
            elif 'newDir' in res:
                dirname = res['newDir']
                fileExplorer.mkdir(_path + '/' + dirname)
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
            return self.json({ 'code': 0, 'msg': '获取备份列表', 'data': res})
        elif _type == 'download':
            # 还原备份的数据
            _url = res['url']
            # 下载备份的文件
            down_res = requests.get(_url)
            backup_path = _path + '/ha_file_explorer_backup.zip'
            with open(backup_path, "wb") as code:
                code.write(down_res.content)
            # 解压文件
            fileExplorer.unzip(backup_path, _path + '/ha_file_explorer_backup')
            # 删除下截的备份文件
            fileExplorer.delete(backup_path)
            # 返回文件夹里的数据
            return self.json({'code':0, 'data': fileExplorer.getAllFile(_path + '/ha_file_explorer_backup') , 'msg': '下载成功'})
        elif _type == 'reset':
            # 替换指定文件
            fileExplorer.move(res['list'])
            return self.json({'code':0, 'msg': '还原成功'})
        elif _type == 'reload':
            _domain = res['domain']
            _com = {
                'ha_file_explorer': ['qn', 'api'],
                'ha_sidebar': ['api_config', 'api_sidebar'],
                'ha_qqmail': ['api_msg']
            }
            # 重新加载模块
            for m in _com[_domain]:
                _m = 'custom_components.' + _domain + '.' + m
                print(_m)
                importlib.reload(sys.modules[_m])
            # 加载主模块
            integration = await loader.async_get_integration(hass, _domain)
            component = integration.get_component()
            importlib.reload(component)
            config = await conf_util.async_hass_config_yaml(hass)
            component.setup(hass, config)
            return self.json({'code':0, 'msg': '重新加载成功'})
        elif _type == 'update':
            _domain = res['domain']
            _url = res['url']
            _path =  hass.config.path("custom_components").replace('\\','/')
            # https://github.com.cnpmjs.org/shaonianzhentan/$DOMAIN
            with open(_path + '/' + DOMAIN + '/update.sh', 'r', encoding='utf-8') as f:
                content = f.read().replace('$PATH', _path).replace('$DOMAIN', _domain).replace('$URL', _url)
            
            _sh =  _path + '/' + DOMAIN + '/' + _domain + '.sh'
            with open(_sh, 'w', encoding='utf-8') as f:
                f.write(content)
            # 如果是windows则直接运行
            if os.name == 'nt':
                os.system(_sh)
            else:
                # os.system('sudo bash ' + _sh)
                os.system('bash ' + _sh)
            return self.json({'code':0, 'msg': '拉取最新代码成功'})
        return self.json(res)

