# clone project from gitee
git clone -b dev https://gitee.com/shaonianzhentan/ha_file_explorer --depth=1
# remove exist files
rm -rf custom_components/ha_file_explorer
# create custom_components dir if not exist
if [ ! -d "custom_components" ]; then
  mkdir custom_components
fi
# copy folder to custom_components dir
cp -r ./ha_file_explorer/custom_components/ha_file_explorer custom_components/ha_file_explorer
# remove files
rm -rf ha_file_explorer