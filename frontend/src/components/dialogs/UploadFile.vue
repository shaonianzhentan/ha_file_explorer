<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from 'vuex'
import api from '../../api/index'
import locales from '../../locales/index'
const store = useStore()
const props = defineProps(['type', 'ok', 'cancel', 'app'])
const isFile = props.type === 'file'
const title = `${locales.upload} ${isFile ? locales.file : locales.folder}`

const app = props.app()
const input = ref<Array<File>>([])
const visible = ref<boolean>(true)
const loading = ref<boolean>(false)

const folderChange = (event: any) => {
    const arr = []
    for (let file of event.target.files) {
        arr.push(file)
    }
    input.value = arr
}

const cancelClick = () => {
    props.cancel()
}
const okClick = async () => {
    if (input.value.length === 0) return;
    loading.value = true
    Promise.all(input.value.map(file => {
        const path = store.getters.absolutePath(isFile ? file.name : file.webkitRelativePath)
        // console.log(path)
        return api.service.uploadFile(path, file)
    })).then(res => {
        app.$toast(`成功上传${res.length}文件`)
        store.dispatch('reloadFileList')
        props.ok({})
        loading.value = false
    })
} 
</script>
<template>
    <va-modal v-model="visible" :title="title" :hide-default-actions="true">
        <va-progress-bar indeterminate v-if="loading" />
        <va-alert color="danger" class="mb-4">
            {{ locales.uploadTips }}
        </va-alert>
        <va-file-upload v-if="isFile" :disabled="loading" v-model="input" />
        <input v-else type="file" @change="folderChange" webkitdirectory />
        <template #footer>
            <va-button :disabled="loading" outline @click="cancelClick" style="margin-right:20px;">
                {{ locales.cancel }}
            </va-button>
            <va-button :disabled="loading" @click="okClick" style="margin-left:20px;">
                {{ locales.confirm }}
            </va-button>
        </template>
    </va-modal>
</template>
<script lang="ts">
export default {
}
</script>
