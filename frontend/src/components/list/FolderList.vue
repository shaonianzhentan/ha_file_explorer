<script setup lang="ts">
</script>

<template>
    <va-card>

        <va-card-title>
            文件夹
            <va-button-dropdown outline size="small">
                <va-button-group size="small">
                    <va-button @click="deleteClick" v-if="pathList.length > 1">删除</va-button>
                    <va-button @click="addClick">新增</va-button>
                </va-button-group>
            </va-button-dropdown>
        </va-card-title>
        <va-card-content>
            <va-list style="padding-top:0;">
                <va-list-item v-for="(item, index) in folderList" :key="index">
                    <va-list-item-section avatar>
                        <va-avatar>
                            <mdi-icon :name="item.icon" />
                        </va-avatar>
                    </va-list-item-section>

                    <va-list-item-section>
                        <va-list-item-label>
                            {{ item.name }}
                        </va-list-item-label>

                        <va-list-item-label caption>
                            {{ item.time }}
                            <va-chip flat size="small" v-if="item.size">
                                {{ item.size }}
                            </va-chip>
                        </va-list-item-label>
                    </va-list-item-section>

                    <va-list-item-section icon>
                        <va-icon name="remove_red_eye" color="gray" @click="showClick(item)" />
                    </va-list-item-section>
                </va-list-item>
            </va-list>


        </va-card-content>
    </va-card>

</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import CreateFile from '../dialogs/CreateFile.vue'
import { deleteHassFile } from '@/api/index'
export default {
    computed: {
        ...mapState(['folderList', 'path']),
        ...mapGetters(['pathList'])
    },
    methods: {
        ...mapActions(['getFileList']),
        showClick(item) {
            this.getFileList(item.name)
        },
        addClick() {
            this.$dialog(CreateFile, {
                type: 'dir'
            })
        },
        deleteClick() {
            const { pathList } = this
            const { name } = pathList[pathList.length - 1]
            if (parent.confirm(`确定删除文件夹【${name}】？`)) {
                deleteHassFile(this.path).then(res => {
                    this.getFileList(pathList.length - 2)
                    this.$toast(res.msg)
                })
            }
        }
    }
}
</script>