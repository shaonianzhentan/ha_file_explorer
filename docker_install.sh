# 切换到HA对应的配置目录
cd /config
# 下载当前项目
git clone https://github.com.cnpmjs.org/shaonianzhentan/ha_file_explorer --depth=1
# 删除已存在的文件夹
rm -rf custom_components/ha_file_explorer
# 复制文件夹
cp -r ./ha_file_explorer/custom_components/ha_file_explorer custom_components
# 删除clone的文件
rm -rf ha_file_explorer