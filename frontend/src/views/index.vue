<script setup lang="ts">
import AppLayout from '../components/layouts/AppLayout.vue'
import FileList from '../components/list/FileList.vue'
import FolderList from '../components/list/FolderList.vue'
</script>

<template>
    <AppLayout class="views-index">
        <template #left>
            <va-button color="#fff" flat :rounded="false">文件管理</va-button>
        </template>
        <template #right>            
        </template>
        <va-card>
            <va-card-title>
                <va-breadcrumbs>
                    <va-breadcrumbs-item :label="item.name" :key="index" href="#" v-for="(item, index) in pathList"
                        @click="changePathClick(index)" />
                </va-breadcrumbs>
            </va-card-title>

        </va-card>

        <div class="row">
            <div class="flex md6">

                <va-card>

                    <va-card-title>
                        文件夹
                    </va-card-title>
                    <va-card-content>
                        <FolderList />
                    </va-card-content>
                </va-card>

            </div>
            <div class="flex md6">

                <va-card>

                    <va-card-title>
                        文件列表
                    </va-card-title>
                    <va-card-content>
                        <FileList />
                    </va-card-content>
                </va-card>
            </div>
        </div>

        <va-backtop target="#va-app-bar-shadow" :vertical-offset="'20px'" :horizontal-offset="'20px'"
            :visibility-height="1" :speed="50">
        </va-backtop>
    </AppLayout>

</template>

<script lang="ts">
import { mapGetters, mapActions } from 'vuex'
export default {
    computed: {
        ...mapGetters(['pathList'])
    },
    created() {
        this.changePathClick(0)
    },
    methods: {
        ...mapActions(['getFileList']),
        changePathClick(index) {
            this.getFileList(index)
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
