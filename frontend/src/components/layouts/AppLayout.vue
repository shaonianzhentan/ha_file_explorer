<script setup lang="ts">
import { showQuickBar, toggleMenu } from '../../api/index'
</script>
<template>
    <div class="wrapper">
        <va-app-bar shadow-on-scroll shadow-color="primary" target="#va-app-bar-shadow" style="z-index: 1;
        --va-app-bar-height: 56px;">
            <va-button :round="true" @click="menuClick" style="margin-left: 20px;">
                <mdi-icon name="mdi-home-assistant" style="color:white; " />
            </va-button>
            <slot name="left"></slot>
            <div class="spacer"></div>
            <slot name="right"></slot>
            <va-button-dropdown style="margin-right: 10px;">
                <va-button-group>
                    <va-button @click="showQuickBarClick('e')">实体</va-button>
                    <va-button @click="showQuickBarClick('c')">命令</va-button>
                </va-button-group>
            </va-button-dropdown>
        </va-app-bar>
        <div id="va-app-bar-shadow">
            <slot></slot>
            <va-progress-bar v-show="loading" indeterminate
                style="position:fixed;bottom:0;left:0; width:100%;z-index: 2;" />
        </div>
    </div>
</template>
<script lang="ts">
import { mapState } from 'vuex'
export default {
    computed: {
        ...mapState(['loading'])
    },
    methods: {
        showQuickBarClick(key: string) {
            showQuickBar(key)
        },
        menuClick() {
            toggleMenu()
        }
    }
}
</script>
 <style scope>
.wrapper {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
}

#va-app-bar-shadow {
    overflow: auto;
}
</style>