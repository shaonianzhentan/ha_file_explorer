<script setup lang="ts">
import { showQuickBar, toggleMenu } from '../../api/index'
</script>
<template>
    <div class="wrapper">
        <va-app-bar shadow-on-scroll shadow-color="primary" target="#va-app-bar-shadow" style="z-index: 1;">
            <mdi-icon name="mdi-home-assistant" @click="menuClick" style="color:white;  padding:0 10px;" />
            <slot name="left" />
            <!-- bug: builds will remove this tag -->
            <va-spacer />
            <!-- -->
            <slot name="right" />
            <va-button-dropdown size="small">
                <va-button-group size="small">
                    <va-button @click="showQuickBarClick('e')">实体</va-button>
                    <va-button @click="showQuickBarClick('c')">命令</va-button>
                </va-button-group>
            </va-button-dropdown>
        </va-app-bar>
        <va-progress-bar v-show="loading" indeterminate
            style="position:fixed;bottom:0;left:0; width:100%;z-index: 2;" />
        <div id="va-app-bar-shadow">
            <slot></slot>
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
}

#va-app-bar-shadow {
    overflow: auto;
}
</style>