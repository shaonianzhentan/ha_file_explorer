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
            升级frontend
          </v-btn>
          <v-btn
            outlined
            rounded
            color="blue lighten-2"
            @click="updateClick(3)"
          >
            升级core
          </v-btn>
          <v-btn
            outlined
            rounded
            color="pink"
            @click="updateClick(4)"
          >
            升级pip
          </v-btn>
        </v-card-actions>
        <v-card-text>
          {{data}}
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>
<script>
import { mapActions } from "vuex";
export default {
  data() {
    return {
      data: "安装日志"
    };
  },
  methods: {
    ...mapActions(["fetchApi"]),
    backClick() {
      this.$router.back();
    },
    async updateClick(type) {
      console.log(type);
      let url = "";
      if (type === 1) {
        // 获取最新版本的依赖包
        const git = await fetch(
          "https://api.github.com/repos/home-assistant/core/releases/latest",
          { mode: "cors" }
        ).then(res => res.json());
        url = `-r https://raw.githubusercontent.com/home-assistant/core/${
          git.name
        }/homeassistant/package_constraints.txt`;
      } else if (type === 2) {
        // 获取前端安装包
        const git = await fetch(
          "https://api.github.com/repos/home-assistant/frontend/releases/latest",
          { mode: "cors" }
        ).then(res => res.json());
        url = `home-assistant-frontend==${git.name}`;
      } else if (type === 3) {
        url = "homeassistant --upgrade";
      } else if (type === 4) {
        url = "pip --upgrade";
      }
      this.fetchApi({
        type: "update-package",
        url
      }).then(res => {
        if (res.code === 0) {
          this.data = res.data;
          this.$toast(res.msg);
        }
      });
    }
  }
};
</script>

<style lang="less" scoped>
</style>
