
import zipfile, tempfile, time, os

'''
root_path: 压缩目录
filter_dir: 过滤目录
filter_name: 全局过滤名称
'''
def zip(root_path, filter_dir=None, filter_name=None):
    # 临时目录
    tmpdir = tempfile.gettempdir()
    # print(tmpdir)
    # 压缩文件
    zf = os.path.join(tmpdir, time.strftime('%y_%m_%d_%H%M%S',time.localtime(time.time())) + ".zip")
    with zipfile.ZipFile(zf, 'w', zipfile.ZIP_DEFLATED) as zip:
        # 遍历文件
        for file_name in os.listdir(root_path):
                file_path = os.path.join(root_path, file_name)
                # 压缩目录
                if os.path.isdir(file_path):
                    for path, dirnames, filenames in os.walk(file_path):
                        # 去掉目标跟路径，只对目标文件夹下边的文件及文件夹进行压缩
                        fpath = path.replace(root_path, '')
                        # 格式化文件名称（斜杠转义）
                        format_name = fpath.replace('\\', '/').strip('/')
                        # 过滤的文件
                        if filter_dir is not None and len(list(filter(lambda x: format_name.startswith(x), filter_dir))) > 0:
                            continue
                        # 全局过滤
                        if filter_name is not None and len(list(filter(lambda x: x in format_name, filter_name))) > 0:
                            continue
                        print('压缩目录：' + format_name)
                        for filename in filenames:
                            zip.write(os.path.join(path, filename), os.path.join(fpath, filename))
                else:
                    zip.write(file_path, file_name)
    return zf

print(zip('D:\code\git\ha_file_explorer\custom_components\ha_file_explorer', ['local/js'], ['__pycache__']))