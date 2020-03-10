# 创建文件夹
rm -rf ~/git_ha_file_explorer
mkdir ~/git_ha_file_explorer
cd ~/git_ha_file_explorer
# 拉取新文件
git init
git remote add -f origin https://github.com/shaonianzhentan/ha_file_explorer
git config core.sparsecheckout true
echo "custom_components/ha_file_explorer" >> .git/info/sparse-checkout
cat .git/info/sparse-checkout
git pull origin master
# 更新文件
cp -rf ~/git_ha_file_explorer/custom_components/ha_file_explorer '$source_path'
# 删除临时文件
rm -rf ~/git_ha_file_explorer