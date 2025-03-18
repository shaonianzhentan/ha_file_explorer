<script setup lang="ts">
import locales from '../../locales/index'
</script>

<template>
    <va-card>

        <va-card-title>
            {{ locales.folder }}
            <va-button-dropdown outline size="small">
                <va-button-group size="small">
                    <va-button @click="renameClick" v-if="pathList.length > 1">
                        {{ locales.rename }}</va-button>
                    <va-button @click="uploadClick">{{ locales.upload }}</va-button>
                    <va-button @click="downloadClick">{{ locales.download }}</va-button>
                    <va-button @click="deleteClick" v-if="pathList.length > 1">{{ locales.delete }}</va-button>
                    <va-button @click="addClick">{{ locales.add }}</va-button>
                </va-button-group>
            </va-button-dropdown>
        </va-card-title>
        <va-card-content>
            <va-list style="padding-top:0;">
                <va-list-item v-for="(item, index) in folderList" :key="index">
                    <va-list-item-section avatar>
                        <img class="brands" v-if="item.iconType == 'img'" :src="loadSrc(item.icon)"
                            @error="loadIcon($event, item.icon)" />
                        <va-avatar v-else color="var(--va-primary)">
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

<script lang="ts">
import { mapState, mapGetters, mapActions } from 'vuex'
import CreateFile from '../dialogs/CreateFile.vue'
import UploadFile from '../dialogs/UploadFile.vue'
import RenameFile from '../dialogs/RenameFile.vue'
export default {
    data() {
        return {
            brands: new Array<string>()
        }
    },
    computed: {
        ...mapState(['folderList', 'path']),
        ...mapGetters(['pathList'])
    },
    methods: {
        ...mapActions(['getFileList']),
        showClick(item: any) {
            this.getFileList(item.name)
        },
        addClick() {
            this.$dialog(CreateFile, {
                type: 'dir'
            })
        },
        uploadClick() {
            this.$dialog(UploadFile, {
                type: 'dir'
            })
        },
        deleteClick() {
            const { pathList } = this
            const { name } = pathList[pathList.length - 1]
            if (parent.confirm(locales.deleteConfirm(name))) {
                this.api.service.deleteHassFile(this.path).then((res: any) => {
                    this.getFileList(pathList.length - 2)
                    this.$toast(res.msg)
                })
            }
        },
        renameClick() {
            this.$dialog(RenameFile, {
                type: 'dir',
                name: ''
            })
        },
        downloadClick(){
            // loading
            this.api.service.deleteHassFile(this.path).then((res: any) => {                    
                // this.$toast(res.msg)
            })
        },
        loadSrc(url: any) {
            if (this.brands.includes(url)) return 'https://brands.home-assistant.io/_/homeassistant/icon.png'
            return url
        },
        loadIcon(event: any, icon: string) {
            this.brands.push(icon)
            event.target.src = `https://brands.home-assistant.io/_/homeassistant/icon.png`
        }
    }
}
</script>
<style lang="scss" scoped>
.brands {
    width: 48px;
    height: 48px;
}
</style>