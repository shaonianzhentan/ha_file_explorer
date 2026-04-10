<script setup lang="ts">
import AppLayout from '../components/layouts/AppLayout.vue'
import locales from '../locales/index'
</script>

<template>
    <AppLayout class="views-editor">
        <template #left>
            <va-chip flat class="header-text" :title="name">
                {{ name }}
            </va-chip>
        </template>
        <template #right>
            <va-button flat :rounded="false" @click="saveClick" class="header-text" :title="locales.save">
                {{locales.save }}
            </va-button>
            <va-button flat :rounded="false" @click="cancelClick" class="header-text" :title="locales.cancel">
                {{locales.cancel}}
            </va-button>
        </template>
        <div id="editor" v-shortkey="['ctrl', 's']" @shortkey="saveClick"></div>
    </AppLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'
import { editorMode } from '../utils/format'
import locales from '../locales'

export default defineComponent({
    data() {
        return {
            name: ''
        }
    },
    computed: {
        ...mapGetters(['absolutePath'])
    },
    created() {

    },
    mounted() {
        this.loadData()
        window.onbeforeunload = function () { return locales.leaveConfirm }
    },
    beforeRouteLeave() {
        window.onbeforeunload = null
    },
    methods: {
        loadData() {
            const { name } = this.$route.params;
            if (!name) {
                return this.$router.replace('/');
            }
            this.name = name as string
            const path = this.absolutePath(name)
            const editor = document.querySelector("#editor") as any
            editor.innerHTML = ''
            this.api.service.getHassFileContent(path).then(({ code, data }) => {
                if (code > 0) {
                    return;
                }
                editor.textContent = data;
                window.editor = window.ace.edit("editor", {
                    theme: "ace/theme/chrome",
                    mode: editorMode(this.name),
                });
                window.editor.commands.addCommand({
                    name: "customSave",
                    bindKey: { win: "Ctrl-s", mac: "Command-s" },
                    exec: () => {
                        this.saveClick()
                    }
                });
                window.editor.commands.removeCommand('save')

                document.body.scrollIntoView();
            })
        },
        cancelClick() {
            this.$router.back()
        },
        saveClick(event?: Event) {
            event?.preventDefault()
            const path = this.absolutePath(this.name)
            const data = window.editor.getValue();
            this.api.service.setHassFileContent(path, data).then(res => {
                this.$toast(res.msg)
            })
        }
    }
})
</script>


<style lang="scss">
.views-editor {
    #editor {
        width: 100%;
        height: calc(100vh - 56px);
    }

    .ace_print-margin-layer {
        display: none;
    }
}
</style>
