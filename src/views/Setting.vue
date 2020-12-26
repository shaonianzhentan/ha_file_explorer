<template>
  <div>
    <v-app-bar
      app
      color="teal"
      dark
    >
      <v-app-bar-nav-icon @click="backClick">
        <v-icon>mdi-keyboard-backspace</v-icon>
      </v-app-bar-nav-icon>
      <v-app-bar-title>设置</v-app-bar-title>
    </v-app-bar>
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
