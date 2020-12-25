import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    showSidebar: false,
    loading: false,
    filePathList: [],
    fileList: [],
    folderList: []
  },
  getters: {
    getFilePath(state) {
      return (name) => `${state.filePathList.join('/')}/${name}`
    }
  },
  mutations: {
    toggleSidebar(state) {
      state.showSidebar = !state.showSidebar
    },
    // 设置文件信息
    setFileInfo(state, { path, list }) {
      if (list.length === 0) {
        Vue.$toast('这是一个空目录')
      }
      state.filePathList = path
      state.fileList = list.filter(ele => ele.type === 'file').map(ele => {
        // 读取后缀名
        const arr = ele.name.split('.')
        let ext = arr[arr.length - 1].toLocaleLowerCase()
        // 图片
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) {
          ext = 'img'
        } else if (['json', 'js', 'css', 'html', 'yaml'].includes(ext)) {
          ext = 'code'
        }
        const mode = {
          code: {
            color: 'pink',
            icon: 'mdi-code-json'
          },
          img: {
            color: 'red',
            icon: 'mdi-file-image'
          },
          py: {
            color: 'purple',
            icon: 'mdi-language-python'
          },
          db: {
            color: 'indigo',
            icon: 'mdi-database'
          },
          log: {
            color: 'deep-purple',
            icon: 'mdi-math-log'
          },
          js: {
            color: 'blue',
            icon: 'mdi-nodejs'
          },
          ha_version: {
            color: 'light-blue',
            icon: 'mdi-home-assistant'
          }
        }
        return {
          ...ele,
          ...(mode[ext] || {
            color: 'blue',
            icon: 'mdi-file'
          })
        }
      })
      state.folderList = list.filter(ele => ele.type === 'dir')
    }
  },
  actions: {
    // 操作文件
    operationFile(context, { name, type }) {
      context.state.loading = true
      let filePathList = context.state.filePathList
      const path = name ? `${filePathList.join('/')}/${name}` : filePathList.join('/')
      if (!name) {
        filePathList.splice(filePathList.length - 1, 1)
      }
      return window.ha.post({ path, type }).then(res => {
        if (res.code === 0) {
          // 刷新
          context.dispatch('getFileList', filePathList)
        } else {
          context.state.loading = false
        }
        Vue.$toast(res.msg)
        return res
      })
    },
    // 获取文件列表
    getFileList(context, path = []) {
      context.state.loading = true
      window.ha.post({
        path: path.join('/'),
        type: "get"
      }).then(res => {
        context.commit("setFileInfo", {
          path,
          list: res.sort((a, b) => {
            if (a.type > b.type) {
              return 1
            } else {
              return -1
            }
          })
        });
      }).finally(() => {
        if (path.length === 0) {
          context.state.loading = false
        } else {
          setTimeout(() => {
            context.state.loading = false
          }, 500)
        }
      })
    },
    // 拉取组件
    fetchApi(context, data) {
      context.state.loading = true
      window.ha.post(data).then(res => {
        if (res.code > 0) {
          Vue.$toast(res.msg)
        }
        return res
      }).finally(() => {
        context.state.loading = false
      })
    }
  },
  modules: {
  }
})
