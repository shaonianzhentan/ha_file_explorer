<template>
  <AppBar title="文件管理">
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
        <div v-if="!isRoot">
          <v-divider></v-divider>
          <!-- 子目录 -->
          <v-list-item @click="showDialog('RenameFolder')">
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
        </div>
      </v-list>
    </v-menu>

    <NewFile ref="NewFile" />
    <NewFolder ref="NewFolder" />
    <UploadFile ref="UploadFile" />
    <UploadFolder ref="UploadFolder" />
    <RenameFolder ref="RenameFolder" />

  </AppBar>

</template>
<script>
import { mapState, mapMutations, mapActions } from "vuex";
export default {
  components: {
    NewFile: () => import("./NewFile"),
    NewFolder: () => import("./NewFolder"),
    UploadFile: () => import("./UploadFile"),
    UploadFolder: () => import("./UploadFolder"),
    RenameFolder: () => import("./RenameFolder")
  },
  data() {
    return {};
  },
  computed: {
    ...mapState(["showSidebar", "filePathList"]),
    isRoot() {
      return this.filePathList.length === 0;
    }
  },
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
      if (this.filePathList.length === 0) {
        return this.$toast("不能删除根目录");
      }
      if (top.confirm("确定删除当前文件夹？")) {
        this.operationFile({
          type: "delete"
        });
      }
    }
  }
};
</script>
