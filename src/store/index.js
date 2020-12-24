import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

window.fetchApi = (data, method = 'POST') => {
  const homeassistant = top.document.querySelector('home-assistant')
  if (homeassistant) {
    return homeassistant.hasAttributes.hass.fetchWithAuth('/ha_file_explorer-api', {
      method,
      body: JSON.stringify(data)
    })
  } else {
    return fetch('http://localhost:8123/ha_file_explorer-api', {
      method,
      body: JSON.stringify(data),
      headers: {
        'authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJlMWMxZjZkMGQ1NDA0MjljODVkMTVmNDdhZjJhMDA3OCIsImlhdCI6MTYwODc3NjU0NSwiZXhwIjoxNjA4Nzc4MzQ1fQ.7om6l5-Vi689SZurpK-Q1xKmKfbCRAhflGOkZoN5l1M'
      }
    }).then(res => {
      if (res.status === 401) {
        Vue.$toast('没有权限')
      }
      return res.json()
    })
  }

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
    // 获取文件列表
    getFileList(context, path = []) {
      context.state.loading = true
      window.fetchApi({
        path: path.join('/'),
        type: "get"
      }, 'GET').then(res => {
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
    }
  },
  modules: {
  }
})
