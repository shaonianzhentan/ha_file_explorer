<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from 'vuex'
import { createHassFile } from '../../api/index'
const store = useStore()
const props = defineProps(['type', 'ok', 'cancel', 'app'])
const isFile = props.type === 'file'
const title = isFile ? '文件' : '文件夹'

const app = props.app()
const input = ref<string>('')
const visible = ref<boolean>(true)

const cancelClick = () => {
    props.cancel()
}
const okClick = async () => {
    if (!input.value) return;
    const path = store.getters.absolutePath(input.value)
    let res = await createHassFile(isFile ? 'file' : 'folder', path)
    app.$toast(res.msg)
    if (res.code > 0) return;
    store.dispatch('reloadFileList')
    props.ok({})
} 
</script>
<template>
    <va-modal v-model="visible" :title="title" :hide-default-actions="true">
        <va-input v-model.trim="input" :placeholder="`${title}名称`" />
        <template #footer>
            <va-button outline @click="cancelClick" style="margin-right:20px;">
                取消
            </va-button>
            <va-button @click="okClick" style="margin-left:20px;">
                确定
            </va-button>
        </template>
    </va-modal>
</template>
<script lang="ts">
export default {
}
</script>
