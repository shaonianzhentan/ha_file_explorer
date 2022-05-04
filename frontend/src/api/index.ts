import store from '../store/index'
import { querySelector } from '../utils/query'

async function hassFullScreen() {
    const subpage = querySelector(parent.document, 'hass-subpage')
    let iframe = subpage.querySelector("iframe");
    let toolbar = subpage.shadowRoot.querySelector('.toolbar')
    subpage.shadowRoot.querySelector('.content').style.height = '100vh'
    iframe.style.position = 'absolute'
    toolbar.style.display = 'none'
    iframe.style.top = '0'
    iframe.style.height = '100%'
}

hassFullScreen()

function fireEvent(type: string, data = {}, ele: any = null) {
    const win = parent as any
    const event = new win.Event(type, {
        bubbles: true,
        cancelable: false,
        composed: true
    });
    event.detail = data;
    if (!ele) {
        ele = querySelector(win.document, 'app-drawer-layout')
    }
    ele.dispatchEvent(event);
}

export function toggleMenu() {
    fireEvent("hass-toggle-menu")
}

/**
 * trigger shortcut key
 * @param key 
 */
export function showQuickBar(key: string) {
    const kb = new (parent as any).KeyboardEvent('keydown', { key });
    kb.composedPath = () => {
        return [{
            tagName: '',
            parentElement: {
                tagName: ''
            }
        }]
    }
    console.log(kb)
    parent.window.dispatchEvent(kb);
}

async function requestApi(data: any) {
    store.commit('loading', true)
    const ha = parent.document.querySelector('home-assistant') as any
    let result = null
    let params = {
        method: 'post',
        body: JSON.stringify(data)
    }
    if (ha) {
        result = ha.hass.fetchWithAuth('/ha_file_explorer-api', params)
    } else {
        const url = `${parent.location.origin}/ha_file_explorer-api`
        let token = ''
        result = fetch(url, {
            ...params,
            headers: {
                authorization: `Bearer ${token}`
            }
        })
    }
    return result.then((res: any) => res.json()).finally(() => {
        store.commit('loading', false)
    })
}

/**
 * 获取文件列表
 * @returns 
 */
export function getHassFileList(path: string) {
    return requestApi({ path, type: "get" })
}

/**
 * 获取文件内容
 * @param path 
 * @returns 
 */
export function getHassFileContent(path: string) {
    return requestApi({ path, type: "get-content" })
}

/**
 * 获取文件内容
 * @param path 
 * @returns 
 */
export function setHassFileContent(path: string, data: string) {
    return requestApi({ path, type: "new-file", data })
}

export function deleteHassFile(path: string) {
    return requestApi({ path, type: "delete" })
}

export default {
    getHassFileList
}