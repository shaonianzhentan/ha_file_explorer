import datetime
import json
import re

from os         import listdir, stat
from os.path    import exists, isdir, isfile, join

class FileExplorer():
    def __init__(self, hass):
        self.hass = hass

    def getDirectory(self, dir):
        allcontent = listdir(dir)
        dirItem    = [] 

        for item in allcontent:
            hashInfo = {}
            if item.startswith('.'):
                continue
            listInfo = stat(join(dir,item))
            hashInfo['name'] = item
            hashInfo['url']  = item
            hashInfo['edit'] = datetime.datetime.fromtimestamp(int(listInfo.st_mtime)).strftime('%Y-%m-%d %H:%M:%S')
            hashInfo['size'] = int(listInfo.st_size)
            if isfile(join(dir,item)):
                hashInfo['type'] = 'file'
            if isdir(join(dir,item)):
                hashInfo['type'] = 'dir'
            dirItem.append(hashInfo)
        return dirItem
    
    def getContent(self, _path):        
        fp = open(_path, 'r', encoding='UTF-8')
        content = fp.read()
        fp.close()
        return content

    def setContent(self, _path, _content):
        fp = open(_path, 'w+', encoding='UTF-8')
        fp.write(_content)
        fp.close()