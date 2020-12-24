<template>
    <v-app-bar
        app
        color="primary"
        dark
    >
        <div class="d-flex align-center">
            <v-btn
                dark
                icon
                @click="toggleSidebar"
            >
                <v-icon>{{showSidebar ? 'mdi-menu-open' : 'mdi-menu'}}</v-icon>
            </v-btn> 文件管理
        </div>

        <v-spacer></v-spacer>
        <v-btn
            dark
            text
        >
            <v-icon>mdi-home-assistant</v-icon> HA菜单
        </v-btn>
        <v-menu
            bottom
            left
        >
            <template v-slot:activator="{ on, attrs }">
                <v-btn
                    dark
                    icon
                    v-bind="attrs"
                    v-on="on"
                >
                    <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
            </template>
            <v-list>
                <v-list-item>
                    <v-list-item-title>新建文件</v-list-item-title>
                </v-list-item>
                <v-list-item>
                    <v-list-item-title>新建文件夹</v-list-item-title>
                </v-list-item>
                <v-list-item>
                    <v-list-item-title>上传文件</v-list-item-title>
                </v-list-item>
                <v-list-item>
                    <v-list-item-title>上传文件夹</v-list-item-title>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item>
                    <v-list-item-title>重命名</v-list-item-title>
                </v-list-item>
                <v-list-item>
                    <v-list-item-title>删除</v-list-item-title>
                </v-list-item>
                <v-list-item>
                    <v-list-item-title>移动</v-list-item-title>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item>
                    <v-list-item-title>下载此目录到当前电脑</v-list-item-title>
                </v-list-item>
                <v-list-item>
                    <v-list-item-title>下载网络文件到此目录</v-list-item-title>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item>
                    <v-list-item-title>上传此目录到七牛云</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>
    </v-app-bar>
</template>
<script>
import { mapState, mapMutations } from "vuex";
export default {
  data() {
    return {};
  },
  computed: mapState(["showSidebar"]),
  methods: {
    ...mapMutations(["toggleSidebar"])
  }
};
</script>
