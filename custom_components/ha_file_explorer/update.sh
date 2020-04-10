# 创建文件夹
rm -rf ~/git_$DOMAIN
mkdir ~/git_$DOMAIN
cd ~/git_$DOMAIN
# 拉取新文件
git init
git remote add -f origin https://github.com.cnpmjs.org/shaonianzhentan/$DOMAIN
git config core.sparsecheckout true
echo "custom_components/$DOMAIN" >> .git/info/sparse-checkout
cat .git/info/sparse-checkout
git pull origin master
# 更新文件
cp -rf ~/git_$DOMAIN/custom_components/$DOMAIN '$PATH'
# 删除临时文件
rm -rf ~/git_$DOMAIN