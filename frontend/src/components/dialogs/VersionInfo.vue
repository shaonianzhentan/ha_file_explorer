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
        <div class="version-info-list">
            <div class="info-item" v-for="item in infolist" :key="item.name">
                <div class="info-name">{{ item.name }}</div>
                <div class="info-value">
                    <a v-if="item.type === 'link'" :href="item.value" target="_blank">{{ item.value }}</a>
                    <span v-else>{{ item.value }}</span>
                </div>
            </div>
        </div>
        <template #footer>
            <va-button @click="okClick">
                OK
            </va-button>
        </template>
    </va-modal>
</template>
<style scoped>
.version-info-list {
  width: 100%;
}
.info-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--va-background-border);
}
.info-item:last-child {
  border-bottom: none;
}
.info-name {
  font-weight: bold;
  margin-right: 1rem;
}
.info-value {
  text-align: right;
  word-break: break-all;
}

@media (max-width: 600px) {
  .info-item {
    flex-direction: column;
  }
  .info-value {
    text-align: left;
    margin-top: 0.25rem;
  }
}
</style>
