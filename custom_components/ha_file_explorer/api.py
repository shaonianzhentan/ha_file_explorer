import datetime, shutil, json, re, zipfile, time, os, uuid, sys, tempfile, homeassistant
from .shaonianzhentan import load_yaml, save_yaml, load_content, save_content, delete_file, get_dir_size, zip

from os         import listdir, stat, remove
from os.path    import exists, isdir, isfile, join
from .qn import Qn
from .const import DOMAIN, MAC_ADDRESS

class FileExplorer():
    def __init__(self, hass):
        self.hass = hass
        self.q = None
        self.storage_dir = hass.config.path(".shaonianzhentan")
        self.storage_file = self.storage_dir + "/ha_file_explorer.yaml"
        self.mkdir(self.storage_dir)        
        # 注册云备份服务
        hass.services.async_register(DOMAIN, 'config', self.config)
        # 加载本地配置
        self.mounted_qn(load_yaml(self.storage_file), 0)

    # 配置服务
    def config(self, call):
        data = call.data
        print(data)
        self.mounted_qn(data, 1)

    # 注册七牛云备份
    def mounted_qn(self, cfg, flags):
        prefix = MAC_ADDRESS[:4]
        access_key = cfg.get('access_key', '')
        secret_key = cfg.get('secret_key', '')
        bucket_name = cfg.get('bucket_name', '')
        download = cfg.get('download', '')
        if access_key != '' and secret_key != '' and bucket_name != '':
            # 保存配置
            if flags == 1:
                save_yaml(self.storage_file, cfg)
                self.hass.async_create_task(self.notify("保存配置成功"))
            try:
                import qiniu
                self.q = Qn(qiniu, qiniu.Auth(access_key, secret_key), self.hass, bucket_name, prefix, download)
                # 注册上传服务
                if self.hass.services.has_service(DOMAIN, 'upload') == False:
                    self.hass.services.async_register(DOMAIN, 'upload', self.upload)
            except Exception as ex:
                print(ex)
                if flags == 1:
                    self.hass.async_create_task(self.notify("出现异常"))

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
            path_name = join(dir,item)
            if exists(path_name) == False:
                continue
            listInfo = stat(path_name)
            hashInfo['name'] = item
            hashInfo['url']  = item
            hashInfo['edit'] = datetime.datetime.fromtimestamp(int(listInfo.st_mtime)).strftime('%Y-%m-%d %H:%M:%S')
                        
            if isfile(path_name):
                hashInfo['type'] = 'file'
                hashInfo['size'] = int(listInfo.st_size)
            if isdir(path_name):
                hashInfo['type'] = 'dir'
                hashInfo['size'] = get_dir_size(path_name)
            dirItem.append(hashInfo)

        dirItem.sort(key=lambda x: x['name'], reverse=True)
        return dirItem
    
    def getContent(self, _path):          
        return load_content(_path)

    def setContent(self, _path, _content):
        save_content(_path, _content)
        
    def delete(self, _path):
        delete_file(_path)

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
    def move(self, _list):
        tmp_path = tempfile.gettempdir() + '/ha_file_explorer_backup'
        try:
            for src in _list:
                # 将要还原的目录替换为空
                _dst = src.replace(tmp_path, self.hass.config.path("./"))
                # print(src)
                # print(_dst)
                # 创建目录
                lastIndex = _dst.replace('\\','/').rindex('/')
                _dir = _dst[0:lastIndex]
                if os.path.isdir(_dir) == False:
                    self.mkdir(_dir)
                    print(_dir)
                shutil.copy2(src, _dst)
        except Exception as ex:
            print(ex)        

    # 压缩单个项
    def zipdir(self, dirname):
        hass = self.hass
        local = tempfile.gettempdir()
        zipfilename = local + '/' + time.strftime('%y_%m_%d_%H%M%S',time.localtime(time.time())) + '+' + str(dirname.replace('\\','+').replace('/','+')) + ".zip"
        print(zipfilename)
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
    def zip(self, _list, filter_dir=None):
        hass = self.hass
        root_path = hass.config.path('./')
        local = tempfile.gettempdir()
        zf = local + '/' + time.strftime('%y_%m_%d_%H%M%S',time.localtime(time.time())) + ".zip"
        with zipfile.ZipFile(zf, 'w', zipfile.ZIP_DEFLATED) as zip:
            for item in _list:
                try:
                    dirpath = hass.config.path('./' + item)
                    # 压缩目录
                    if isdir(dirpath):
                        for path,dirnames,filenames in os.walk(dirpath):
                            # 去掉目标跟路径，只对目标文件夹下边的文件及文件夹进行压缩
                            fpath = path.replace(root_path,'')                            
                            # 如果过滤的文件
                            if filter_dir is not None and len(list(filter(lambda x: x in fpath, filter_dir))) > 0:
                                continue
                            # print('压缩目录：' + fpath)
                            for filename in filenames:
                                zip.write(os.path.join(path,filename), os.path.join(fpath,filename))
                    else:
                        zip.write(dirpath, item)
                except Exception as ex:
                    print(ex)
                    pass                
        return zf

    # 解压
    def unzip(self, src_file, dest_dir):
        zf = zipfile.ZipFile(src_file)
        try:
           zf.extractall(path=dest_dir)
        except RuntimeError as e:
           print(e)
        zf.close()

    async def notify(self, message):
        await self.hass.services.async_call('persistent_notification', 'create', {"message": message, "title": "文件管理", "notification_id": "ha_file_explorer"})

    async def upload(self, call):
        data = call.data
        filter_dir = data.get('filter', [])
        filter_dir.extend(['home-assistant_v2.db', 'home-assistant.log', 'deps', 'media', 'core', 'custom_components/ha_file_explorer'])
        await self.notify('开始压缩上传备份文件')
        zf = zip(self.hass.config.path('./'), filter_dir, ['node_modules', '__pycache__'])
        await self.q.upload(zf)
        self.delete(zf)
        print('上传成功')
        await self.notify('备份文件上传成功')