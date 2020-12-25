<template>
  <div class="home">
    <FileListPanel ref="FileListPanel" />
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
  </div>
</template>

<script>
import { mapMutations } from "vuex";

export default {
  name: "Home",
  components: {
    FileListPanel: () => import("@/components/FileListPanel")
  },
  data() {
    return {
      items: [
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
    };
  },
  computed: {
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
  methods: {
    ...mapMutations(["toggleSidebar"]),
    linkClick({ href }) {
      this.$router.push(href);
    }
  }
};
</script>
