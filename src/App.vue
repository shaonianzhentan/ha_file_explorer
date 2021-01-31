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
        <v-divider></v-divider>
        <v-list-item
          v-for="item in haItems"
          :key="item.title"
          link
          @click="haLinkClick(item)"
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
    <!-- footer -->
    <v-footer padless>
      <v-card
        elevation="2"
        flat
        tile
        class="text-center"
        style="width:100%;"
      >
        <v-card-text>

          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                class="mx-4"
                icon
                href="https://shaonianzhentan.github.io/ha-docs/#/"
                target="_blank"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon size="24px">
                  mdi-book-edit
                </v-icon>
              </v-btn>
            </template>
            <span>Home Assistant 学习笔记</span>
          </v-tooltip>

          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                class="mx-4"
                icon
                href="https://space.bilibili.com/39523884"
                target="_blank"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon size="24px">
                  mdi-file-video
                </v-icon>
              </v-btn>
            </template>
            <span>Home Assistant 视频学习记录</span>
          </v-tooltip>

          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                class="mx-4"
                icon
                href="https://github.com/shaonianzhentan/ha_file_explorer"
                target="_blank"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon size="24px">
                  mdi-github
                </v-icon>
              </v-btn>
            </template>
            <span>GitHub项目地址</span>
          </v-tooltip>
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                class="mx-4"
                icon
                href="https://www.home-assistant.io/"
                target="_blank"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon size="24px">
                  mdi-home-assistant
                </v-icon>
              </v-btn>
            </template>
            <span>Home Assistant 官网</span>
          </v-tooltip>

          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                class="mx-4"
                icon
                href="https://unpkg.com/@mdi/font@5.8.55/preview.html"
                target="_blank"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon size="24px">
                  mdi-format-font
                </v-icon>
              </v-btn>
            </template>
            <span>MDI图标预览</span>
          </v-tooltip>

          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                class="mx-4"
                icon
                href="https://www.npmjs.com/package/@mdi/font"
                target="_blank"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon size="24px">
                  mdi-npm
                </v-icon>
              </v-btn>
            </template>
            <span>MDI图标NPM包</span>
          </v-tooltip>

          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                class="mx-4"
                icon
                href="https://vuetifyjs.com/zh-Hans/"
                target="_blank"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon size="24px">
                  mdi-vuetify
                </v-icon>
              </v-btn>
            </template>
            <span>前端UI框架 - Vuetify</span>
          </v-tooltip>

        </v-card-text>

        <v-card-text class="pt-0">
          如果你觉得这个项目对你的帮助，请在GitHub上给这个项目一个Star
        </v-card-text>

        <v-divider></v-divider>

        <v-card-text>
          {{ new Date().getFullYear() }} — <strong>版本：{{ver}}</strong>
        </v-card-text>
      </v-card>
    </v-footer>
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
      { title: "工具箱", icon: "mdi-tools", href: "/Tools" },
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
    ],
    haItems: [
      {
        title: "自动化",
        icon: "mdi-android",
        href: "/config/automation/dashboard"
      },
      {
        title: "场景",
        icon: "mdi-home-automation",
        href: "/config/scene/dashboard"
      },
      {
        title: "脚本",
        icon: "mdi-script-text",
        href: "/config/script/dashboard"
      },
      { title: "服务控制", icon: "mdi-server", href: "/config/server_control" }
    ],
    ver: window.ha.ver || "测试版"
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
    },
    haLinkClick({ href }) {
      top.history.pushState(null, null, href);
      window.ha.fire("location-changed", { replace: true }, top);
    }
  }
};
</script>
