<template>
  <div>
    <v-app-bar
      app
      color="deep-purple"
      dark
    >
      <v-app-bar-nav-icon @click="backClick">
        <v-icon>mdi-keyboard-backspace</v-icon>
      </v-app-bar-nav-icon>
      <v-toolbar-title>云备份</v-toolbar-title>

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
