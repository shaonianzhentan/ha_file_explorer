<script setup lang="ts">
import locales from '../../locales/index'
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
                    <va-button @click="showQuickBarClick('e')">{{ locales.entities }}</va-button>
                    <va-button @click="showQuickBarClick('c')">{{ locales.command }}</va-button>
                </va-button-group>
            </va-button-dropdown>
        </va-app-bar>
        <div id="va-app-bar-shadow">
            <slot></slot>
            <div class="loading">

                <va-progress-bar v-show="loading" indeterminate />

            </div>
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
            this.api.showQuickBar(key)
        },
        menuClick() {
            this.api.fireEvent("hass-toggle-menu")
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

.loading {
    position: fixed;
    width: 100%;
    left: 0px;
    bottom: 8px;
    height: 8px;
}
</style>