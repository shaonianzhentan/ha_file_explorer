#!/bin/bash

'''
这是一个安装最新版HACS的脚本
命令来源项目：https://github.com/hacs-china/integration
'''

RED='\E[1;31m'       # 红
GREEN='\E[1;32m'    # 绿
YELOW='\E[1;33m'    # 黄
BLUE='\E[1;34m'     # 蓝
PINK='\E[1;35m'     # 粉红
RES='\E[0m'          # 清除颜色

console() {
    echo -e  "${RED}$1${RES}"
}

console "清除hacs.zip文件"

rm -rf hacs.zip

console "下载最新hacs发布文件"
wget https://hub.fastgit.xyz/hacs-china/integration/releases/latest/download/hacs.zip

console "删除hacs目录"
rm -rf custom_components/hacs

console "解压到自定义组件目录"
unzip hacs.zip -d custom_components/hacs

# 判断解压命令是否执行成功
if [ $? -eq 0 ]
then
    console "安装成功，请重启HomeAssistant使用其生效"
    # 删除
    rm -rf hacs.zip
else
    console "安装失败，请手动解压"
fi