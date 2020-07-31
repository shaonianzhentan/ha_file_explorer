import datetime, shutil, json, re, zipfile, time, os, uuid, sys, multiprocessing

from os         import listdir, stat, remove
from os.path    import exists, isdir, isfile, join
from .qn import Qn

class FileExplorer():
    def __init__(self, hass, cfg):
        self.hass = hass
        access_key = cfg.get('access_key', '')
        secret_key = cfg.get('secret_key', '')
        bucket_name = cfg.get('bucket_name', '')
        prefix = cfg.get('prefix', '')
        download = cfg.get('download', '')
        if access_key != '' and secret_key != '' and bucket_name != '':
            #构建鉴权对象
            self.bucket_name = bucket_name
            self.prefix = prefix
            self.q = Qn(access_key, secret_key, bucket_name, prefix, download)
        else:
            self.q = None   

    def getAllFile(self, dir):
        allcontent = listdir(dir)
        dirItem    = [] 

        for item in allcontent:
            hashInfo = {}
            filePath = join(dir,item)
            if exists(filePath) == False:
                continue
            # 过滤指定目录
            if item == '__pycache__':
                continue
            listInfo = stat(filePath)
            hashInfo['name'] = item
            hashInfo['url']  = filePath
            if isdir(filePath):
                hashInfo['child'] = self.getAllFile(filePath)
            dirItem.append(hashInfo)
        return dirItem

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
            if exists(join(dir,item)) == False:
                continue
            listInfo = stat(join(dir,item))
            hashInfo['name'] = item
            hashInfo['url']  = item
            hashInfo['edit'] = datetime.datetime.fromtimestamp(int(listInfo.st_mtime)).strftime('%Y-%m-%d %H:%M:%S')
                        
            if isfile(join(dir,item)):
                hashInfo['type'] = 'file'
                hashInfo['size'] = int(listInfo.st_size)
            if isdir(join(dir,item)):
                hashInfo['type'] = 'dir'
                hashInfo['size'] = self.get_dir_size(join(dir,item))
            dirItem.append(hashInfo)

        dirItem.sort(key=lambda x: x['name'], reverse=True)
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

    # 获取文件夹大小
    def get_dir_size(self, dir):
        size = 0
        for root, dirs, files in os.walk(dir):
            size += sum([os.path.getsize(os.path.join(root, name)) for name in files])
        return size

    # 创建文件夹
    def mkdir(self, path):
        folders = []        
        while not os.path.isdir(path):
            path, suffix = os.path.split(path)
            folders.append(suffix)
        for folder in folders[::-1]:
            path = os.path.join(path, folder)
            os.mkdir(path)
    
    # 替换文件
    def move(self, list):
        for src in list:
            _dst = src.replace('/ha_file_explorer_backup','')
            # 创建目录
            lastIndex = _dst.replace('\\','/').rindex('/')
            _dir = _dst[0:lastIndex]
            if os.path.isdir(_dir) == False:
                self.mkdir(_dir)
                print(_dir)
            shutil.copy2(src, _dst)

    # 压缩单个项
    def zipdir(self, dirname):
        hass = self.hass
        local = hass.config.path("ha_file_explorer_backup")
        self.mkdir(local)
        zipfilename = local + '/' + time.strftime('%Y%m%d%H%M%S',time.localtime(time.time())) + '+' + str(dirname.replace('\\','+').replace('/','+')) + ".zip"
        filelist = []
        dirname = hass.config.path('./' + dirname)
        if os.path.isfile(dirname):
            filelist.append(dirname)
        else :
            for root, dirs, files in os.walk(dirname):
                for name in files:
                    filelist.append(os.path.join(root, name))
        zf = zipfile.ZipFile(zipfilename, "w", zipfile.ZIP_DEFLATED)
        for tar in filelist:
            arcname = tar[len(dirname):]
            #print arcname
            zf.write(tar,arcname)
        zf.close()

        return zipfilename

    # 压缩
    def zip(self, _list):
        hass = self.hass
        root_path = hass.config.path('./')
        local = hass.config.path("ha_file_explorer_backup")
        self.mkdir(local)
        zf = local + '/' + time.strftime('%Y%m%d%H%M%S',time.localtime(time.time())) + '_'  + str(uuid.uuid4()) + ".zip"
        with zipfile.ZipFile(zf, 'w', zipfile.ZIP_DEFLATED) as zip:
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
        return zf

    # 解压
    def unzip(self, src_file, dest_dir):
        zf = zipfile.ZipFile(src_file)
        try:
           zf.extractall(path=dest_dir)
        except RuntimeError as e:
           print(e)
        zf.close()

    def run(self, func, args):
        pool = multiprocessing.Pool()
        res = pool.map(func, args)
        if len(res) > 0:
            return res[0]
        return None

    def notify(self, message):
        self.hass.services.call('persistent_notification', 'create', {"message": message, "title": "文件管理", "notification_id": "ha_file_explorer"})

    def upload(self, call):
        config_path = self.hass.config.path('./')
        print(config_path)
        file_list = self.getDirectory(config_path)
        # 上传文件
        filter_list = filter(lambda x: ['ha_file_explorer_backup', 'home-assistant_v2.db', 'home-assistant.log', 'deps'].count(x['name']) == 0, file_list)
        list_name = list(map(lambda x: x['name'], list(filter_list)))
        print(list_name)
        self.notify('开始压缩上传备份文件')
        zf = self.zip(list_name)
        self.run(self.q.upload, [zf])
        self.delete(zf)
        print('上传成功')
        self.notify('备份文件上传成功')