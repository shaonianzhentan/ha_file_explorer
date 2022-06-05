<script setup lang="ts">
import AppLayout from '../components/layouts/AppLayout.vue'
import locales from '../locales/index'
</script>

<template>
    <AppLayout class="views-editor">
        <template #left>
            <va-chip flat color="#fff">
                {{ name }}
            </va-chip>
        </template>
        <template #right>
            <va-button color="#fff" flat :rounded="false" v-shortkey="['ctrl', 's']" @shortkey="saveClick()"
                @click="saveClick">{{ locales.save }}</va-button>
            <va-button color="#fff" flat :rounded="false" @click="cancelClick">{{ locales.cancel }}</va-button>
        </template>
        <div id="editor"></div>
    </AppLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'
import { editorMode } from '../utils/format'

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
        window.onbeforeunload = function () { return "确定离开当前页吗？" }
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
                document.body.scrollIntoView();
            })
        },
        cancelClick() {
            this.$router.back()
        },
        saveClick() {
            const path = this.absolutePath(this.name)
            let data = window.editor.getValue();
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
