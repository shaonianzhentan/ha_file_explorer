import { createStore } from 'vuex'
import { getHassFileList } from '../api/index'
import { formatSize, formatFileIcon, formatFolderIcon } from '../utils/format'

const store = createStore({
    state: {
        loading: false,
        path: '',
        fileList: [],
        folderList: []
    },
    getters: {
        pathList(state) {
            return state.path.split('/').map(value => {
                if (!value || value === '.') {
                    return {
                        name: 'HA',
                        value: '.'
                    }
                }
                return {
                    name: value,
                    value
                }
            })
        },
        absolutePath(state, getters) {
            return (name: string) => {
                let arr = getters.pathList.map((ele: any) => ele.value)
                arr.push(name)
                return arr.join('/')
            }
        }
    },
    mutations: {
        setFileList(state, { path, list }) {
            state.path = path
            const arr = list.map((ele: any) => {
                ele.size = formatSize(ele.size)
                let icon = null
                if (ele.type === 'file') {
                    icon = formatFileIcon(path, ele.name)
                } else {
                    icon = formatFolderIcon(path, ele.name)
                }
                return {
                    ...ele,
                    ...icon
                }
            })
            arr.sort((a: any, b: any) => {
                if (a.name > b.name) return 1
                return -1
            })
            state.fileList = arr.filter((ele: any) => ele.type === 'file')
            state.folderList = arr.filter((ele: any) => ele.type === 'dir')
        },
        loading(state, loading: boolean) {
            state.loading = loading
        }
    },
    actions: {
        getFileList({ commit, getters, state }, data: number | string) {
            if (state.loading) return;
            let arr = getters.pathList.map((ele: any) => ele.value)
            if (typeof data === 'number') {
                arr.splice(data + 1)
            } else {
                arr.push(data)
            }
            const path = arr.join('/')
            getHassFileList(path).then((list) => {
                commit('setFileList', { path, list })
            })
        },
        reloadFileList({ commit, getters, state }) {
            let path = getters.pathList.map((ele: any) => ele.value).join('/')
            getHassFileList(path).then((list) => {
                commit('setFileList', { path, list })
            })
        }
    }
})

export default store