<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import api from '../../api/index'
const store = useStore()
const props = defineProps(['type', 'name', 'ok', 'cancel', 'app'])
const isFile = props.type === 'file'
const title = isFile ? '文件' : '文件夹'


const name = computed(() => {
    if (isFile) return props.name

    let path = store.getters.absolutePath(props.name)
    const arr = path.split('/')
    arr.splice(arr.length - 1, 1)
    return arr[arr.length - 1]
})

const app = props.app()
const input = ref<string>('')
const visible = ref<boolean>(true)

const cancelClick = () => {
    props.cancel()
}
const okClick = async () => {
    if (!input.value) return;
    let path = store.getters.absolutePath(props.name)
    let new_path = store.getters.absolutePath(input.value)
    if (!isFile) {
        const arr = path.split('/')
        arr.splice(arr.length - 1, 1)
        path = arr.join('/')
        arr[arr.length - 1] = input.value
        new_path = arr.join('/')
        // console.log(path, new_path)
    }
    let res = await api.service.rename(path, new_path)
    app.$toast(res.msg)
    if (res.code > 0) return;
    store.dispatch('reloadFileList', isFile ? '' : new_path)
    props.ok({})
} 
</script>
<template>
    <va-modal v-model="visible" :title="title" :hide-default-actions="true">
        <va-alert outline>
            当前名称：{{ name }}
        </va-alert>
        <va-input v-model.trim="input" :placeholder="`新名称`" />
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
