<template>
  <v-app>
    <!-- loading -->
    <v-overlay :value="loading">
      <v-progress-circular
        indeterminate
        size="64"
      ></v-progress-circular>
    </v-overlay>
    <!-- toast -->
    <v-snackbar v-model="snackbar.show">
      {{ snackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn
          color="pink"
          text
          v-bind="attrs"
          @click="snackbar.show = false"
        >
          关闭
        </v-btn>
      </template>
    </v-snackbar>
    <!-- 导航 -->
    <v-navigation-drawer
      app
      right
      v-model="showSidebar"
    >
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="title">
            文件管理
          </v-list-item-title>
          <v-list-item-subtitle>
            File Explorer
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <v-list
        dense
        nav
      >
        <v-list-item
          v-for="item in items"
          :key="item.title"
          link
          @click="linkClick(item)"
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <keep-alive>
        <router-view></router-view>
      </keep-alive>
    </v-main>
  </v-app>
</template>

<script>
import Vue from "vue";
import { mapState, mapMutations } from "vuex";
export default {
  name: "App",
  data: () => ({
    snackbar: {
      text: "",
      show: false
    },
    items: [
      { title: "首页", icon: "mdi-home", href: "/" },
      { title: "云备份", icon: "mdi-backup-restore", href: "/Backup" },
      { title: "我的插件", icon: "mdi-apps-box", href: "/PlugIn" },
      {
        title: "HA升级",
        icon: "mdi-home-assistant",
        href: "/Update"
      },
      {
        title: "设置",
        icon: "mdi-cog",
        href: "/Setting"
      }
    ]
  }),
  computed: {
    ...mapState(["loading"]),
    showSidebar: {
      get() {
        return this.$store.state.showSidebar;
      },
      set(value) {
        if (value != this.$store.state.showSidebar) {
          this.toggleSidebar && this.toggleSidebar();
        }
      }
    }
  },
  beforeCreate() {
    Vue.$toast = Vue.prototype.$toast = text => {
      this.snackbar.text = text;
      this.snackbar.show = true;
    };
  },
  methods: {
    ...mapMutations(["toggleSidebar"]),
    linkClick({ href }) {
      this.$router.push(href);
    }
  }
};
</script>
