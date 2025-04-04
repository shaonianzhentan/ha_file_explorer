import os, shutil, uuid, yaml, logging, aiohttp, json, urllib, hashlib, datetime, asyncio, base64, re, zipfile, tempfile, time

# 获取当前文件列表
def get_dir_list(dir):
    allcontent = os.listdir(dir)
    dirItem    = []
    for item in allcontent:
        try:
            # 获取文件路径
            path_name = os.path.join(dir,item)
            # 判断当前路径是否存在
            if os.path.exists(path_name) == False:
                continue
            hashInfo = {}
            listInfo = os.stat(path_name)
            hashInfo['name'] = item
            hashInfo['path']  = item
            hashInfo['time'] = datetime.datetime.fromtimestamp(int(listInfo.st_mtime)).strftime('%Y-%m-%d %H:%M:%S')

            if os.path.isfile(path_name):
                hashInfo['type'] = 'file'
                hashInfo['size'] = int(listInfo.st_size)
            if os.path.isdir(path_name):
                hashInfo['type'] = 'dir'
                hashInfo['size'] = get_dir_size(path_name)
            # 显示格式化文件大小
            hashInfo['size_name'] = format_byte(hashInfo['size'])
            dirItem.append(hashInfo)
        except Exception as ex:
            print(ex)
    # 以名称排序
    dirItem.sort(key=lambda x: x['name'], reverse=True)
    return dirItem

# 创建目录
def mkdir(path):
    if os.path.isdir(path) == False:
        folders = []
        while not os.path.isdir(path):
            path, suffix = os.path.split(path)
            folders.append(suffix)
        for folder in folders[::-1]:
            path = os.path.join(path, folder)
            os.mkdir(path)

# 获取目录大小
def get_dir_size(dir):
    size = 0
    for root, dirs, files in os.walk(dir):
        size += sum([os.path.getsize(os.path.join(root, name)) for name in files])
    return size

# 格式化文件大小的函数
def format_byte(res):
    bu = 1024
    if res < bu:
        res = f'{bu}B'
    elif bu <= res < bu**2:
        res = f'{round(res / bu, 2)}KB'
    elif bu**2 <= res < bu**3:
        res = f'{round(res / bu**2, 2)}MB'
    elif bu**3 <= res < bu**4:
        res = f'{round(res / bu**3, 2)}GB'
    elif bu**4 <= res < bu**5:
        res = f'{round(res / bu**4, 2)}TB'
    return res

# 删除文件
def delete_file(file_path):
    if os.path.exists(file_path):
        if os.path.isfile(file_path):
            # 删除文件
            os.remove(file_path)
        elif os.path.isdir(file_path):
            # 删除目录
            shutil.rmtree(file_path, ignore_errors=True)

# 移动文件
def move_file(source_file, target_file):
    # 创建目录
    lastIndex = target_file.replace('\\','/').rindex('/')
    _dir = target_file[0:lastIndex]
    if os.path.isdir(_dir) == False:
        mkdir(_dir)
    shutil.move(source_file, target_file)

# 复制文件
def copy_file(source_file, target_file):
    # 创建目录
    lastIndex = target_file.replace('\\','/').rindex('/')
    _dir = target_file[0:lastIndex]
    if os.path.isdir(_dir) == False:
        mkdir(_dir)
    shutil.copy2(source_file, target_file)

# 加载yaml
def load_yaml(file_path):
    # 不存在则返回空字典
    if os.path.exists(file_path) == False:
        return {}
    fs = open(file_path, encoding="UTF-8")
    data = yaml.load(fs, Loader=yaml.FullLoader)
    return data

# 存储为yaml
def save_yaml(file_path, data):
    _dict = {}
    _dict.update(data)
    with open(file_path, 'w') as f:
        yaml.dump(_dict, f)

# 加载json
def load_json(file_path):
    # 不存在则返回空字典
    if os.path.exists(file_path) == False:
        return {}
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data

# 存储为json
def save_json(file_path, data):
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)

def read_file(file_path):
    ''' 读取文件 '''
    with open(file_path, 'rb') as f:
      content = f.read()
      return content

# 加载内容
def load_content(file_path):
    fp = open(file_path, 'r', encoding='UTF-8')
    content = fp.read()
    fp.close()
    return content

# 保存内容
def save_content(file_path, data):
    fp = open(file_path, 'w+', encoding='UTF-8')
    fp.write(data)
    fp.close()

# base64数据生成文件
def base64_to_file(base64_data, file):
    ori_image_data = base64.b64decode(base64_data)
    fout = open(file, 'wb')
    fout.write(ori_image_data)
    fout.close()

def dir_to_zip(path):
    ''' 文件夹压缩成ZIP文件 '''
    if os.path.isdir(path):
        temp_dir = tempfile.gettempdir()
        zip_path = os.path.join(temp_dir, f"{os.path.basename(path) or 'ha'}.zip")
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for root, dirs, files in os.walk(path):
                for file in files:
                    zipf.write(os.path.join(root, file),
                               os.path.relpath(os.path.join(root, file),
                                               os.path.join(path, '..')))
        return zip_path