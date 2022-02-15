import datetime, shutil, zipfile, time, os, tempfile
from .shaonianzhentan import sidebar_add, delete_file, get_dir_size, zip, mkdir

from homeassistant.const import __version__ as current_version
from os         import listdir, stat
from os.path    import exists, isdir, isfile, join
from .qn import Qn
from .const import DOMAIN, MAC_ADDRESS, VERSION, ROOT_PATH, NAME, ICON
from .view import HAView

class FileExplorer():

    def __init__(self, hass, config):
        self.hass = hass
        self.q = None
        # 注册静态目录
        hass.http.register_static_path(ROOT_PATH, hass.config.path("custom_components/" + DOMAIN + "/local"), False)
        hass.http.register_view(HAView)
        # 注册菜单栏
        sidebar_add(hass, NAME, ICON, DOMAIN, ROOT_PATH + "/index.html?ver=" + VERSION)
        # 初始化七牛云服务
        self.mounted_qn(config)
        # 注册上传服务
        if self.hass.services.has_service(DOMAIN, 'upload') == False:
            self.hass.services.async_register(DOMAIN, 'upload', self.upload)

    # 注册七牛云备份
    def mounted_qn(self, cfg):
        prefix = MAC_ADDRESS[:4]
        access_key = cfg.get('access_key', '')
        secret_key = cfg.get('secret_key', '')
        bucket_name = cfg.get('bucket_name', '')
        download = cfg.get('download', '')
        if access_key != '' and secret_key != '' and bucket_name != '':
            try:
                import qiniu
                self.q = Qn(qiniu, qiniu.Auth(access_key, secret_key), self.hass, bucket_name, prefix, download)
            except Exception as ex:
                print(ex)
                self.hass.async_create_task(self.notify("七牛云备份出现异常" + str(ex)))

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
            try:
                hashInfo = {}
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
            except Exception as ex:
                print(ex)

        dirItem.sort(key=lambda x: x['name'], reverse=True)
        return dirItem
    
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
                mkdir(_dir)
                shutil.copy2(src, _dst)
        except Exception as ex:
            print(ex)

    # 压缩多个文件
    def zip(self, _list, filter_dir=None):
        hass = self.hass
        root_path = hass.config.path('./')
        local = tempfile.gettempdir()
        zf = f"{local}/_{current_version}_{int(time.time())}.zip"
        with zipfile.ZipFile(zf, 'w', zipfile.ZIP_DEFLATED) as zip:
            for item in _list:
                try:
                    dirpath = hass.config.path('./' + item)
                    # 压缩目录
                    if isdir(dirpath):
                        for path,dirnames,filenames in os.walk(dirpath):
                            # 去掉目标跟路径，只对目标文件夹下边的文件及文件夹进行压缩
                            fpath = path.replace(root_path, '')
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
            for info in zf.infolist():
                unzip_path = os.path.abspath(dest_dir + '/' + info.filename)
                zf.extract(info, unzip_path)
        except RuntimeError as e:
           print(e)
        zf.close()

    async def notify(self, message):
        await self.hass.services.async_call('persistent_notification', 'create', {"message": message, "title": "文件管理", "notification_id": "ha_file_explorer"})

    async def upload(self, call):
        data = call.data
        filter_dir = data.get('filter', [])
        filter_dir.extend(['home-assistant_v2.db', 'home-assistant_v2.db-shm', 'home-assistant_v2.db-wal', 'home-assistant.log', 'deps', 'media', 'core', 'custom_components/ha_file_explorer'])
        await self.notify('开始压缩上传备份文件')
        zf = zip(self.hass.config.path('./'), f"_{current_version}_{int(time.time())}.zip", filter_dir, ['node_modules', '__pycache__', '.npm'], self.hass.config.path('./custom_components/ha_file_explorer/local/backup/'))
        # 如果配置了七牛云服务
        if self.q is not None:
            await self.q.upload(zf)
            delete_file(zf)
            print('上传成功')
            await self.notify('备份文件上传成功')
        else:
            await self.notify('备份文件成功，请在文件管理器内查看')