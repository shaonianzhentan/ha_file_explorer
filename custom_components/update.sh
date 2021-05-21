# 创建文件夹
rm -rf ~/git_$DOMAIN
mkdir ~/git_$DOMAIN
cd ~/git_$DOMAIN
# 拉取新文件
git clone $URL --depth=1
# 更新文件
cp -rf ~/git_$DOMAIN/$PROJECT/custom_components/$DOMAIN '$PATH'
# 删除临时文件
rm -rf ~/git_$DOMAIN