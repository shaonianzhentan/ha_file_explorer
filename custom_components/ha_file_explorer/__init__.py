import logging
from .api import FileExplorer
from .view import HAView
_LOGGER = logging.getLogger(__name__)

from .const import DOMAIN, VERSION, URL, ROOT_PATH

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
    cfg  = config[DOMAIN]    
    sidebar_title = cfg.get('sidebar_title', '文件管理')
    sidebar_icon = cfg.get('sidebar_icon', 'mdi:folder')
    # 七牛云配置
    fileExplorer = FileExplorer(hass, cfg)
    hass.data[DOMAIN] = fileExplorer    

    # 注册静态目录
    hass.http.register_static_path(ROOT_PATH, hass.config.path("custom_components/" + DOMAIN + "/local"), False)    
    hass.http.register_view(HAView)

    # 注册菜单栏
    hass.components.frontend.async_register_built_in_panel(
        "iframe",
        sidebar_title,
        sidebar_icon,
        DOMAIN,
        {"url": ROOT_PATH + "/index.html?ver=" + VERSION},
        require_admin=True
    )
    return True

async def async_setup_entry(hass, entry):
    # print("集成安装=============================")
    setup(hass, { DOMAIN: entry.data })
    return True
