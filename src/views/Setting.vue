<template>
  <div>
    <AppBar
      color="teal"
      title="设置"
    />
  </div>
</template>
<script>
import { mapActions } from "vuex";
export default {
  data() {
    return {};
  },
  methods: {
    ...mapActions(["fetchApi"]),
    backClick() {
      this.$router.back();
    }
  }
};
</script>

<style lang="less" scoped>
</style>
