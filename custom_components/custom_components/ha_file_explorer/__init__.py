import logging
from .shaonianzhentan import sidebar_add
from .api import FileExplorer
from .view import HAView
_LOGGER = logging.getLogger(__name__)

from .const import DOMAIN, VERSION, URL, ROOT_PATH, NAME, ICON

def setup(hass, config):
    # 如果没有配置则不运行
    if DOMAIN not in config:
        return True
    # 如果已经运行，则不进行操作
    if DOMAIN in hass.data:
        return True
    # 显示插件信息
    _LOGGER.info('''
-------------------------------------------------------------------

    文件管理插件【作者QQ：635147515】
    
    版本：''' + VERSION + '''    
    
    介绍：在HA里使用的文件管理器
    
    项目地址：https://github.com/shaonianzhentan/ha_file_explorer
    
-------------------------------------------------------------------''')
    # 七牛云配置
    hass.data[DOMAIN] = FileExplorer(hass)
    # 注册静态目录
    hass.http.register_static_path(ROOT_PATH, hass.config.path("custom_components/" + DOMAIN + "/local"), False)    
    hass.http.register_view(HAView)
    # 注册菜单栏
    sidebar_add(hass, NAME, ICON, DOMAIN, ROOT_PATH + "/index.html?ver=" + VERSION)
    return True

async def async_setup_entry(hass, entry):
    setup(hass, { DOMAIN: entry.data })
    return True
