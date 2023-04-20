
import service from './service';
import { querySelector } from '../utils/query'

class API {
    constructor() {
        // console.log('api')
        this.hassFullScreen()
    }

    get service() {
        return service
    }

    async hassFullScreen() {
        const subpage = querySelector(parent.document, 'hass-subpage')
        let iframe = subpage.querySelector("iframe");
        let toolbar = subpage.shadowRoot.querySelector('.toolbar')
        subpage.shadowRoot.querySelector('.content').style.height = '100vh'
        iframe.style.position = 'absolute'
        toolbar.style.display = 'none'
        iframe.style.top = '0'
        iframe.style.height = '100%'
    }

    fireEvent(type: string, data = {}, ele: any = null) {
        const win = parent as any
        const event = new win.Event(type, {
            bubbles: true,
            cancelable: false,
            composed: true
        });
        event.detail = data;
        if (!ele) {
            ele = querySelector(win.document, 'home-assistant-main')
        }
        ele.dispatchEvent(event);
    }

    showQuickBar(key: string) {
        const event = new (parent as any).Event("hass-quick-bar-trigger", {
            bubbles: true,
            cancelable: false,
            composed: true
        });
        event.detail = {
            key,
            composedPath() {
                return [{
                    tagName: '',
                    parentElement: {
                        tagName: ''
                    }
                }]
            }
        };
        // console.log(kb)
        parent.window.dispatchEvent(event);
    }
}
const api = new API()
export default api