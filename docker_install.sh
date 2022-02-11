# 切换到HA对应的配置目录
cd /config
# 下载当前项目
git clone https://ghproxy.com/https://github.com/shaonianzhentan/ha_file_explorer --depth=1
# 删除已存在的文件夹
rm -rf custom_components/ha_file_explorer
# 创建自定义组件目录
if [ ! -d "custom_components" ]; then
  mkdir custom_components
fi
# 复制文件夹
cp -r ./ha_file_explorer/custom_components/ha_file_explorer custom_components/ha_file_explorer
# 删除clone的文件
rm -rf ha_file_explorer

# 安装依赖
pip3 install qiniu