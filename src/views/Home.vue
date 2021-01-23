<template>
  <div class="home">
    <FileListPanel ref="FileListPanel" />
  </div>
</template>

<script>
export default {
  name: "Home",
  components: {
    FileListPanel: () => import("@/components/FileListPanel")
  },
  data() {
    return {};
  },
  computed: {},
  methods: {}
};
</script>
