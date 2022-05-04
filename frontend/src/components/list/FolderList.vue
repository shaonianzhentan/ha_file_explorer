<script setup lang="ts">
</script>

<template>
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


</template>

<script>
import { mapState, mapActions } from 'vuex'
export default {
    computed: {
        ...mapState(['folderList'])
    },
    methods: {
        ...mapActions(['getFileList']),
        showClick(item) {
            this.getFileList(item.name)
        }
    }
}
</script>