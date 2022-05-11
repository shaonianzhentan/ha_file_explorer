<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from 'vuex'

interface VersionInfo {
    name: string,
    value: string,
    type?: string
}

const store = useStore()
const props = defineProps(['ok'])
const title = 'File Explorer'
const visible = ref<boolean>(true)
const query = new URLSearchParams(location.search)

const infolist = ref<Array<VersionInfo>>([
    {
        name: 'Version',
        value: query.get('v') || 'dev'
    },
    {
        name: 'Author',
        value: 'shaonianzhentan'
    },
    {
        name: 'Link',
        value: 'https://github.com/shaonianzhentan/ha_file_explorer',
        type: 'link'
    },
    {
        name: 'UI',
        value: 'https://vuestic.dev',
        type: 'link'
    },
    {
        name: 'Icon',
        value: 'https://unpkg.com/@mdi/font@latest/preview.html',
        type: 'link'
    },
    {
        name: 'Bilibili',
        value: 'https://space.bilibili.com/39523884',
        type: 'link'
    },
    {
        name: 'HA notes',
        value: 'https://ha.jiluxinqing.com',
        type: 'link'
    }
])

const okClick = async () => {
    props.ok({})
} 
</script>
<template>
    <va-modal v-model="visible" :title="title" :hide-default-actions="true">
        <table class="va-table">
            <tbody>
                <tr v-for="item in infolist" :key="item.name">
                    <td>{{ item.name }}</td>
                    <td>
                        <a v-if="item.type === 'link'" :href="item.value" target="_blank">{{ item.value }}</a>
                        <span v-else>{{ item.value }}</span>
                    </td>
                </tr>
            </tbody>
        </table>
        <template #footer>
            <va-button @click="okClick">
                OK
            </va-button>
        </template>
    </va-modal>
</template>