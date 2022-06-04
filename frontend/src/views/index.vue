<script setup lang="ts">
import AppLayout from '../components/layouts/AppLayout.vue'
import FileList from '../components/list/FileList.vue'
import FolderList from '../components/list/FolderList.vue'
</script>

<template>
    <AppLayout class="views-index">
        <template #left>
            <va-button color="#fff" flat :rounded="false" @click="versionClick">文件管理</va-button>
        </template>
        <template #right>
        </template>
        <va-card>
            <va-card-title>
                <va-breadcrumbs>
                    <va-breadcrumbs-item :label="item.name" :key="index" v-for="(item, index) in pathList"
                        @click="changePathClick(index)" />
                </va-breadcrumbs>
            </va-card-title>

        </va-card>

        <div class="row">
            <div class="flex md6">
                <FolderList />
            </div>
            <div class="flex md6">
                <FileList />
            </div>
        </div>

        <va-backtop target="#va-app-bar-shadow" :vertical-offset="'20px'" :horizontal-offset="'20px'"
            :visibility-height="1" :speed="50">
        </va-backtop>
    </AppLayout>

</template>

<script lang="ts">
import { mapGetters, mapActions } from 'vuex'
import VersionInfo from '@/components/dialogs/VersionInfo.vue'
export default {
    computed: {
        ...mapGetters(['pathList'])
    },
    created() {
        this.changePathClick(0)
    },
    methods: {
        ...mapActions(['getFileList']),
        changePathClick(index: number) {
            this.getFileList(index)
        },
        versionClick() {
            this.$dialog(VersionInfo)
        }
    }
}
</script>

<style lang="scss">
.views-index {
    .va-card {
        margin: 5px;
    }

    .va-breadcrumb-item__label {
        cursor: pointer;
    }

    .md6 {
        .va-card__title {
            justify-content: space-between;
            padding-right: 40px;
            padding-left: 30px;
        }
    }

    .va-list-item {
        &:hover {
            background: #eee;
        }

        .va-list-item-label--caption {
            display: flex;
            align-items: center;
        }
    }
}
</style>
