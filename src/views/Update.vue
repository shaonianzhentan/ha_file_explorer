<template>
  <div>
    <v-app-bar
      app
      color="blue"
      dark
    >
      <v-app-bar-nav-icon @click="backClick">
        <v-icon>mdi-keyboard-backspace</v-icon>
      </v-app-bar-nav-icon>
      <v-toolbar-title>HomeAssistant升级</v-toolbar-title>

    </v-app-bar>
    <v-container>
      <v-card>
        <v-card-actions>
          <v-btn
            outlined
            rounded
            color="primary"
            @click="updateClick(1)"
          >
            升级核心依赖
          </v-btn>
          <v-btn
            outlined
            rounded
            color="deep-purple lighten-2"
            @click="updateClick(2)"
          >
            升级home-assistant/frontend
          </v-btn>
          <v-btn
            outlined
            rounded
            color="blue lighten-2"
            @click="updateClick(3)"
          >
            升级home-assistant/core
          </v-btn>
        </v-card-actions>
        <v-card-text>
          sdfsdfsdfsdf
        </v-card-text>
      </v-card>

    </v-container>
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
    },
    updateClick(type) {
      console.log(type);
      this.fetchApi({
        type: "update-package"
      }).then(res => {
        if (res.code === 0) {
          this.$toast(res.msg);
        }
      });
    }
  }
};
</script>

<style lang="less" scoped>
</style>
