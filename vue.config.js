module.exports = {
  publicPath: './',
  outputDir: 'custom_components/ha_file_explorer/local',
  productionSourceMap: false,
  // "transpileDependencies": [
  //   "vuetify"
  // ],
  configureWebpack: {
    externals: {
      'vue': 'Vue',
      'vuex': 'Vuex',
      'vue-router': 'VueRouter',
      'vuetify': 'Vuetify',
    }
  },
  chainWebpack: config => {
    config.plugin('html')
      .tap(args => {
        args[0].title = "文件管理 - File Explorer";
        return args;
      })
  }
}