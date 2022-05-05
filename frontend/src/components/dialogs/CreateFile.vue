<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from 'vuex'
import { setHassFileContent, mkdirHass } from '../../api/index'
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
    let res = null;
    if (isFile) {
        res = await setHassFileContent(path, '')
    } else {
        res = await mkdirHass(path)
    }
    store.dispatch('reloadFileList')
    app.$toast(res.msg)
    props.ok({})
} 
</script>
<template>
    <va-modal v-model="visible" :title="title" :hide-default-actions="true">
        <va-alert color="danger">
            警告：如果当前{{ title }}存在，会进行覆盖操作，请自行检查是否已经存在
        </va-alert>
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