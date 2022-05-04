<script setup lang="ts">

import AppLayout from '../components/layouts/AppLayout.vue'
</script>

<template>
    <AppLayout class="views-editor">
        <template #left>
            <va-chip flat color="#fff">
                {{ name }}
            </va-chip>
        </template>
        <template #right>
            <va-button color="#fff" flat :rounded="false" @click="saveClick">保存</va-button>
            <va-button color="#fff" flat :rounded="false" @click="cancelClick">取消</va-button>
        </template>
        <div id="editor"></div>
    </AppLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'
import { getHassFileContent, setHassFileContent } from '../api/index'
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
        // window.onbeforeunload = function () { return "确定离开当前页吗？" }
        document.addEventListener("keydown", this.saveKeydown, false);
    },
    beforeRouteLeave() {
        // window.onbeforeunload = null
        document.removeEventListener("keydown", this.saveKeydown);
    },
    methods: {
        loadData() {
            const { name } = this.$route.params;
            if (!name) {
                return this.$router.replace('/');
            }
            this.name = name as string
            const path = this.absolutePath(name)
            const editor = document.querySelector("#editor")
            editor.innerHTML = ''
            getHassFileContent(path).then(({ code, data }) => {
                if (code > 0) {
                    return;
                }
                editor.textContent = data;
                window.editor = window.ace.edit("editor", {
                    theme: "ace/theme/chrome",
                    mode: editorMode(name),
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
            setHassFileContent(path, data).then(res => {
                this.$toast(res.msg)
            })
        },
        saveKeydown(event: KeyboardEvent) {
            if (event.ctrlKey && event.key === "s") {
                this.$toast("正在保存中...");
                this.saveClick();
                event.preventDefault();
            }
        }
    }
})
</script>


<style lang="scss">
.views-editor {
    #editor {
        width: 100%;
        height: calc(100vh - 36px);
    }

    .ace_print-margin-layer {
        display: none;
    }
}
</style>
