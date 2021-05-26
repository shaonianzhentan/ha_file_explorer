import uuid
from .shaonianzhentan import get_mac_address_key

MAC_ADDRESS = get_mac_address_key().lower()

NAME = "文件管理"
ICON = "mdi:folder"
DOMAIN = "ha_file_explorer"
VERSION = '2.5.3'
URL = '/' + DOMAIN +'-api'
ROOT_PATH = '/' + DOMAIN +'-local/' + VERSION