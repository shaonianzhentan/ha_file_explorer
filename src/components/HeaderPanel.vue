<template>
    <v-app-bar
        app
        color="primary"
        dark
    >
        <div class="d-flex align-center">
            <v-btn
                dark
                text
                @click="dockedClick"
            >
                <v-icon>mdi-home-assistant</v-icon> 文件管理
            </v-btn>
        </div>

        <v-spacer></v-spacer>

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
                <v-list-item @click="showDialog('NewFile')">
                    <v-list-item-title>新建文件</v-list-item-title>
                </v-list-item>
                <v-list-item @click="showDialog('NewFolder')">
                    <v-list-item-title>新建文件夹</v-list-item-title>
                </v-list-item>
                <v-list-item @click="showDialog('UploadFile')">
                    <v-list-item-title>上传文件</v-list-item-title>
                </v-list-item>
                <v-list-item @click="showDialog('UploadFolder')">
                    <v-list-item-title>上传文件夹</v-list-item-title>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item>
                    <v-list-item-title>重命名</v-list-item-title>
                </v-list-item>
                <v-list-item @click="deleteClick">
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

        <v-btn
            dark
            icon
            @click="toggleSidebar"
        >
            <v-icon>{{showSidebar ? 'mdi-menu-open' : 'mdi-menu'}}</v-icon>
        </v-btn>
        <NewFile ref="NewFile" />
        <NewFolder ref="NewFolder" />
        <UploadFile ref="UploadFile" />
        <UploadFolder ref="UploadFolder" />
    </v-app-bar>
</template>
<script>
import { mapState, mapMutations, mapActions } from "vuex";
export default {
  components: {
    NewFile: () => import("./NewFile"),
    NewFolder: () => import("./NewFolder"),
    UploadFile: () => import("./UploadFile"),
    UploadFolder: () => import("./UploadFolder")
  },
  data() {
    return {};
  },
  computed: mapState(["showSidebar"]),
  methods: {
    ...mapMutations(["toggleSidebar"]),
    ...mapActions(["operationFile"]),
    dockedClick() {
      window.ha.fire("hass-toggle-menu");
    },
    showDialog(name) {
      this.$refs[name].show();
    },
    deleteClick() {
      this.operationFile({
        type: "delete"
      });
    }
  }
};
</script>
