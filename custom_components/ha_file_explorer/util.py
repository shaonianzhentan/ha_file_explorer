import os, sys, platform

def pip_install(package):
    cmd = f'python{sys.version_info.major}.{sys.version_info.minor} -m pip install {package}'
    print(cmd)
    r = os.popen(cmd)
    info = r.readlines()
    arr = []
    for line in info:
        arr.append(line)
    return ''.join(arr)