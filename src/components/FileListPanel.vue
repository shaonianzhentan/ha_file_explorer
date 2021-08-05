<template>
  <v-container>
    <HeaderPanel />
    <v-card elevation="2">
      <FilePathNav />
      <v-divider></v-divider>
      <template v-if="moveFile.name">
        <v-list-item>
          <v-list-item-avatar>
            <v-icon class="orange lighten-1" dark> mdi-file-lock </v-icon>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title>{{ moveFile.name }}</v-list-item-title>

            <v-list-item-subtitle>
              <span class="font-weight-light"
                >文件路径：{{ moveFile.path }}</span
              >
              <br />
              <span class="text--disabled"
                >注意：切换到对应目录后，点击移动文件小图标</span
              >
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn icon v-bind="attrs" v-on="on" @click="moveFileToClick">
                  <v-icon color="orange lighten-1">mdi-file-move</v-icon>
                </v-btn>
              </template>
              <span>移动到当前目录</span>
            </v-tooltip>
          </v-list-item-action>
        </v-list-item>
        <v-divider></v-divider>
      </template>
      <v-list subheader two-line>
        <v-subheader
          inset
          v-if="folderList.length > 0"
          @click="showFolder = !showFolder"
          class="pointer"
          :class="{ fold: !showFolder }"
          >文件夹</v-subheader
        >

        <v-list-item
          v-for="item in folderList"
          :key="item.name"
          v-show="showFolder"
        >
          <v-list-item-avatar>
            <v-icon class="grey lighten-1" dark> mdi-folder </v-icon>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title v-text="item.name"></v-list-item-title>

            <v-list-item-subtitle>
              <span class="text--disabled">{{ item.edit }}</span>
              <span class="font-weight-light" v-if="item.sizeName">
                — {{ item.sizeName }}</span
              >
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-btn icon @click="openFolder(item)">
              <v-icon color="grey lighten-1">mdi-folder-open</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>

        <v-divider inset v-if="folderList.length > 0"></v-divider>

        <v-subheader
          inset
          v-if="fileList.length > 0"
          @click="showFile = !showFile"
          class="pointer"
          :class="{ fold: !showFile }"
          >文件列表</v-subheader
        >

        <v-list-item
          v-for="item in fileList"
          :key="item.name"
          v-show="showFile"
        >
          <v-list-item-avatar>
            <v-icon :class="item.color" dark v-text="item.icon"></v-icon>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title v-text="item.name"></v-list-item-title>
            <v-list-item-subtitle>
              <span class="text--disabled">{{ item.edit }}</span>
              <span class="font-weight-light" v-if="item.sizeName">
                — {{ item.sizeName }}</span
              >
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-menu bottom left>
              <template v-slot:activator="{ on, attrs }">
                <v-btn dark icon v-bind="attrs" v-on="on">
                  <v-icon color="grey lighten-1">mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  v-if="filePathList[0] === 'www'"
                  :href="getLink(item)"
                  target="_blank"
                >
                  <v-list-item-title>打开</v-list-item-title>
                </v-list-item>
                <v-list-item @click="editClick(item)">
                  <v-list-item-title>编辑</v-list-item-title>
                </v-list-item>
                <v-list-item @click="renameClick(item)">
                  <v-list-item-title>重命名</v-list-item-title>
                </v-list-item>
                <v-list-item @click="deleteClick(item)">
                  <v-list-item-title>删除</v-list-item-title>
                </v-list-item>
                <v-list-item @click="moveFileClick(item)">
                  <v-list-item-title>移动到...</v-list-item-title>
                </v-list-item>
                <v-list-item
                  @click="unzipClick(item)"
                  v-if="/.+\.zip$/.test(item.name)"
                >
                  <v-list-item-title>解压到当前文件夹</v-list-item-title>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item @click="downloadFileClick(item)">
                  <v-list-item-title>下载文件</v-list-item-title>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item @click="uploadQnClick(item)">
                  <v-list-item-title>上传此文件到七牛云</v-list-item-title>
                </v-list-item>
                <v-list-item
                  @click="restoreClick(item)"
                  v-if="isRestoreFile(item)"
                >
                  <v-list-item-title>还原</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card>
    <RenameFile ref="RenameFile" />
    <RestoreDialog ref="RestoreDialog" />
  </v-container>
</template>
<script>
import { mapActions, mapState } from "vuex";
export default {
  components: {
    HeaderPanel: () => import("./HeaderPanel"),
    FilePathNav: () => import("./FilePathNav"),
    RenameFile: () => import("./RenameFile"),
    RestoreDialog: () => import("@/components/RestoreDialog"),
  },
  data() {
    return {
      showFolder: true,
      showFile: true,
      folders: [
        {
          title: "测试",
          subtitle: "相关信息",
        },
      ],
      files: [
        {
          title: "测试",
          subtitle: "相关信息",
          icon: "mdi-information",
          color: "red",
        },
      ],
      // 移动的文件
      moveFile: {
        name: "",
        path: "",
      },
    };
  },
  computed: mapState(["filePathList", "fileList", "folderList"]),
  created() {
    this.initData();
  },
  methods: {
    ...mapActions([
      "getFileList",
      "fetchApi",
      "operationFile",
      "refreshFileList",
    ]),
    initData() {
      this.getFileList([]);
    },
    getLink({ name }) {
      const { filePathList } = this;
      let arr = JSON.parse(JSON.stringify(filePathList));
      arr[0] = "local";
      return `/${arr.join("/")}/${name}`;
    },
    openFolder(item) {
      const { filePathList } = this;
      filePathList.push(item.name);
      this.getFileList(filePathList);
    },
    editClick({ name }) {
      this.$router.push({
        name: "editFile",
        params: {
          name,
        },
      });
    },
    deleteClick({ name }) {
      if (top.confirm(`确定删除文件【${name}】？`)) {
        this.operationFile({ type: "delete", name });
      }
    },
    // 移动文件
    moveFileClick({ name }) {
      this.moveFile = {
        name,
        path: this.$store.getters.getFilePath(name),
      };
      document.body.scrollIntoView();
    },
    moveFileToClick() {
      const { name, path } = this.moveFile;
      this.fetchApi({
        type: "move-file",
        url: path,
        path: this.$store.getters.getFilePath(name),
      }).then(({ code, msg }) => {
        if (code == 0) {
          this.moveFile = {
            name: "",
            path: "",
          };
        }
        this.$toast(msg);
        this.refreshFileList();
      });
    },
    unzipClick({ name }) {
      if (top.confirm("警告：请确定知道这个功能怎么使用？")) {
        this.fetchApi({
          type: "unzip",
          path: this.$store.getters.getFilePath(name),
        }).then(({ msg }) => {
          this.$toast(msg);
          this.refreshFileList();
        });
      }
    },
    // 下载文件
    downloadFileClick({ name }) {
      this.fetchApi({
        type: "download-file",
        path: this.$store.getters.getFilePath(name),
      }).then(({ msg }) => {
        this.$toast(msg);
      });
    },
    uploadQnClick({ name }) {
      this.fetchApi({
        type: "qn-upload",
        path: this.$store.getters.getFilePath(name),
      }).then(({ msg }) => {
        this.$toast(msg);
      });
    },
    renameClick({ name }) {
      this.$refs["RenameFile"].show(name);
    },
    // 数据还原
    restoreClick({ name }) {
      const url = location.href.split("index.html")[0] + "backup/" + name;
      this.$refs["RestoreDialog"].show(url);
    },
    isRestoreFile(item) {
      const { filePathList } = this;
      const filePath = filePathList.join("/");
      return (
        filePath.indexOf("custom_components/ha_file_explorer/local/backup") >=
          0 && /.+\.zip$/.test(item.name)
      );
    },
  },
};
</script>
<style lang="less" scoped>
.pointer {
  cursor: pointer;
  &.fold {
    color: #1b76d2;
  }
}
</style>