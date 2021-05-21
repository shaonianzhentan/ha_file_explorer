import uuid

# 获取本机MAC地址
def get_mac_address(): 
    mac=uuid.UUID(int = uuid.getnode()).hex[-12:] 
    return ":".join([mac[e:e+2] for e in range(0,11,2)])

MAC_ADDRESS = get_mac_address().replace(':','').lower()

NAME = "文件管理"
ICON = "mdi:folder"
DOMAIN = "ha_file_explorer"
VERSION = '2.5.1'
URL = '/' + DOMAIN +'-api'
ROOT_PATH = '/' + DOMAIN +'-local/' + VERSION