<script setup lang="ts">
const props = defineProps(['name'])
</script>
<template>
    <i :class="`mdi ${props.name}`"></i>
</template>
<style scoped>
.mdi {
    font-size: 20px;
}
</style>