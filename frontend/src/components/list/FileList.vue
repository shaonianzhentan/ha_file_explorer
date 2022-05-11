<script setup lang="ts">
</script>

<template>
    <va-card>

        <va-card-title>
            文件列表
            <va-button-dropdown outline size="small">
                <va-button-group size="small">
                    <va-button @click="addClick">新增</va-button>
                </va-button-group>
            </va-button-dropdown>
        </va-card-title>
        <va-card-content>
            <va-list style="padding-top:0;">
                <va-list-item v-for="(item, index) in fileList" :key="index">
                    <va-list-item-section avatar>
                        <va-avatar color="var(--va-primary)">
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
                        <va-button-dropdown size="small">
                            <va-button-group outline size="small">
                                <va-button @click="deleteClick(item.name)">删除</va-button>
                                <va-button @click="editClick(item.name)">编辑</va-button>
                            </va-button-group>
                        </va-button-dropdown>
                    </va-list-item-section>
                </va-list-item>

            </va-list>

        </va-card-content>
    </va-card>

</template>
<script lang="ts">
import { mapState, mapGetters, mapActions } from 'vuex'
import { deleteHassFile } from '../../api/index'
import CreateFile from '../dialogs/CreateFile.vue'
export default {
    computed: {
        ...mapState(['fileList']),
        ...mapGetters(['absolutePath'])
    },
    methods: {
        ...mapActions(['reloadFileList']),
        deleteClick(fileName: string) {
            if (parent.confirm(`确定删除文件【${fileName}】？`)) {
                deleteHassFile(this.absolutePath(fileName)).then(res => {
                    this.reloadFileList()
                    this.$toast(res.msg)
                })
            }
        },
        editClick(fileName: string) {
            this.$router.push({
                name: 'editor',
                params: {
                    name: fileName
                }
            })
        },
        addClick() {
            this.$dialog(CreateFile, {
                type: 'file'
            })
        }
    }
}
</script>