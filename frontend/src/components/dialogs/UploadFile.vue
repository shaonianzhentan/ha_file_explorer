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
    const uploadCount = 0

    for (let i = 0; i < input.value.length; i++) {
        try {
            const file = input.value[i]
            const path = store.getters.absolutePath(isFile ? file.name : file.webkitRelativePath)
            const result = await api.service.uploadFile(path, file)

            input.value.splice(i, 1);
            i--;
        } catch (error) {
            console.error(`Failed to upload ${files[i].name}:`, error);
        }
        uploadCount++
    }

    app.$toast(`成功上传${uploadCount}文件`)
    store.dispatch('reloadFileList')
    props.ok({})
    loading.value = false

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
        <va-list>
            <va-list-item v-for="(item, index) in input" :key="index">
                <va-list-item-section>
                    <va-list-item-label>{{ item.name }}</va-list-item-label>
                </va-list-item-section>
            </va-list-item>
        </va-list>
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
