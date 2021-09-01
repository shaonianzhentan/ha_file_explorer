import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

function formatSize(value) {
  if (value == 0) return ''
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(2)} MB`
  if (value >= 1024) return `${(value / 1024).toFixed(2)} KB`
  return `${value} B`
}

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
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'ico'].includes(ext)) {
          ext = 'img'
        } else if (['yaml', 'DS_Store'].includes(ext)) {
          ext = 'code'
        } else if (['ha_version', 'config_entries', 'device_registry', 'entity_registry', 'restore_state'].includes(ext)) {
          ext = 'homeassistant'
        } else if (['m3u8', 'mp4', 'flv', 'm3u'].includes(ext)) {
          ext = 'video'
        } else if (['mp3', 'm4a'].includes(ext)) {
          ext = 'audio'
        } else if (['gz', 'rar', 'tz'].includes(ext)) {
          ext = 'zip'
        } else if (['html', 'htm'].includes(ext)) {
          ext = 'html'
        } else if (['db-shm', 'db-wal'].includes(ext)) {
          ext = 'db'
        }
        const mode = {
          code: {
            color: 'red',
            icon: 'mdi-code-braces'
          },
          img: {
            color: 'pink',
            icon: 'mdi-file-image'
          },
          py: {
            color: 'purple',
            icon: 'mdi-language-python'
          },
          log: {
            color: 'deep-purple',
            icon: 'mdi-math-log'
          },
          db: {
            color: 'indigo',
            icon: 'mdi-database'
          },
          js: {
            color: 'light-green',
            icon: 'mdi-nodejs'
          },
          homeassistant: {
            color: 'light-blue',
            icon: 'mdi-home-assistant'
          },
          json: {
            color: 'cyan',
            icon: 'mdi-code-json'
          },
          md: {
            color: 'teal',
            icon: 'mdi-language-markdown'
          },
          html: {
            color: 'green',
            icon: 'mdi-language-html5'
          },
          video: {
            color: 'blue',
            icon: 'mdi-file-video'
          },
          audio: {
            color: 'lime',
            icon: 'mdi-file-music'
          },
          zip: {
            color: 'yellow',
            icon: 'mdi-folder-zip'
          },
          svg: {
            color: 'amber',
            icon: 'mdi-svg'
          },
          css: {
            color: 'orange',
            icon: 'mdi-language-css3'
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
    operationFile(context, { name, type, rename_path }) {
      context.state.loading = true
      let filePathList = context.state.filePathList
      const path = name ? `${filePathList.join('/')}/${name}` : filePathList.join('/')
      if (!name) {
        filePathList.splice(filePathList.length - 1, 1)
      }
      return window.ha.post({ path, type, rename_path }).then(res => {
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
    // 刷新文件列表
    refreshFileList(context) {
      context.dispatch('getFileList', context.state.filePathList)
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
          }).map(ele => {
            // 大小格式化
            ele['sizeName'] = formatSize(ele.size)
            return ele
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
      return window.ha.post(data).then(res => {
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
