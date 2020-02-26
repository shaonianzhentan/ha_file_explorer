import datetime, shutil, json, re, zipfile, time, os, uuid

from os         import listdir, stat, remove
from os.path    import exists, isdir, isfile, join
from qiniu import Auth, put_file, etag
import qiniu.config

class FileExplorer():
    def __init__(self, hass, cfg):
        self.hass = hass
        access_key = cfg.get('access_key', '')
        secret_key = cfg.get('secret_key', '')
        bucket_name = cfg.get('bucket_name', '')
        prefix = cfg.get('prefix', '')
        if access_key != '' and secret_key != '' and bucket_name != '':
            #构建鉴权对象
            self.bucket_name = bucket_name
            self.prefix = prefix
            self.q = Auth(access_key, secret_key)
        else:
            self.q = None   

    def getDirectory(self, dir):
        allcontent = listdir(dir)
        dirItem    = [] 

        for item in allcontent:
            hashInfo = {}
            '''
            print(item)
            if item.startswith('.'):
                continue
            '''
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
        
    def delete(self, _path):
        if exists(_path):
            if isfile(_path):
                # 删除文件
                remove(_path)
            elif isdir(_path):
                # 删除目录
                shutil.rmtree(_path, ignore_errors=True)

    # 创建文件夹
    def mkdir(self, path):
        folders = []
        while not os.path.isdir(path):
            path, suffix = os.path.split(path)
            folders.append(suffix)
        for folder in folders[::-1]:
            path = os.path.join(path, folder)
            os.mkdir(path)
            
    # 压缩
    def zip(self, _list):
        hass = self.hass
        root_path = hass.config.path('./')
        local = hass.config.path("custom_components/ha_file_explorer/local/data")
        self.mkdir(local)
        with zipfile.ZipFile(local + '/' + time.strftime('%Y_%m_%d_%H_%M_%S',time.localtime(time.time())) + '_'  + str(uuid.uuid4()) + ".zip", 'w', zipfile.ZIP_DEFLATED) as zip:
            for item in _list:
                dirpath = hass.config.path('./' + item) 
                # 压缩目录
                if isdir(dirpath):
                    for path,dirnames,filenames in os.walk(dirpath):
                        # 去掉目标跟路径，只对目标文件夹下边的文件及文件夹进行压缩
                        fpath = path.replace(root_path,'')
                        for filename in filenames:
                            zip.write(os.path.join(path,filename), os.path.join(fpath,filename))
                else:
                    zip.write(dirpath, item)
        return local

    # 上传
    def upload(self, localfile):
        key = 'HomeAssistant/' + self.prefix + os.path.basename(localfile)
        token = self.q.upload_token(self.bucket_name, key, 3600)
        res = put_file(token, key, localfile)
        print(res)
