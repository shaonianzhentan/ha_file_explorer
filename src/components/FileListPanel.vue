<template>
    <v-container>
        <HeaderPanel />
        <v-card elevation="2">
            <FilePathNav />
            <v-divider></v-divider>
            <v-list
                subheader
                two-line
            >
                <v-subheader
                    inset
                    v-if="folderList.length > 0"
                    @click="showFolder = !showFolder"
                    class="pointer"
                    :class="{fold: !showFolder}"
                >文件夹</v-subheader>

                <v-list-item
                    v-for="(item) in folderList"
                    :key="item.name"
                    v-show="showFolder"
                >
                    <v-list-item-avatar>
                        <v-icon
                            class="grey lighten-1"
                            dark
                        >
                            mdi-folder
                        </v-icon>
                    </v-list-item-avatar>

                    <v-list-item-content>
                        <v-list-item-title v-text="item.name"></v-list-item-title>

                        <v-list-item-subtitle v-text="item.edit"></v-list-item-subtitle>
                    </v-list-item-content>

                    <v-list-item-action>
                        <v-btn
                            icon
                            @click="openFolder(item)"
                        >
                            <v-icon color="grey lighten-1">mdi-folder-open</v-icon>
                        </v-btn>
                    </v-list-item-action>
                </v-list-item>

                <v-divider
                    inset
                    v-if="folderList.length > 0"
                ></v-divider>

                <v-subheader
                    inset
                    v-if="fileList.length > 0"
                    @click="showFile = !showFile"
                    class="pointer"
                    :class="{fold: !showFile}"
                >文件列表</v-subheader>

                <v-list-item
                    v-for="(item) in fileList"
                    :key="item.name"
                    v-show="showFile"
                >
                    <v-list-item-avatar>
                        <v-icon
                            :class="item.color"
                            dark
                            v-text="item.icon"
                        ></v-icon>
                    </v-list-item-avatar>

                    <v-list-item-content>
                        <v-list-item-title v-text="item.name"></v-list-item-title>
                        <v-list-item-subtitle v-text="item.edit"></v-list-item-subtitle>
                    </v-list-item-content>

                    <v-list-item-action>
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
                                    <v-icon color="grey lighten-1">mdi-dots-vertical</v-icon>
                                </v-btn>
                            </template>
                            <v-list>
                                <v-list-item @click="editClick(item)">
                                    <v-list-item-title>编辑</v-list-item-title>
                                </v-list-item>
                                <v-list-item>
                                    <v-list-item-title>重命名</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click="deleteClick(item)">
                                    <v-list-item-title>删除</v-list-item-title>
                                </v-list-item>
                                <v-list-item>
                                    <v-list-item-title>移动</v-list-item-title>
                                </v-list-item>
                                <v-divider></v-divider>
                                <v-list-item>
                                    <v-list-item-title>下载文件</v-list-item-title>
                                </v-list-item>
                                <v-divider></v-divider>
                                <v-list-item>
                                    <v-list-item-title>上传此文件到七牛云</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </v-list-item-action>
                </v-list-item>
            </v-list>
            <v-divider></v-divider>
            <FooterPanel />
        </v-card>
    </v-container>
</template>
<script>
import { mapActions, mapState } from "vuex";
export default {
  components: {
    HeaderPanel: () => import("./HeaderPanel"),
    FilePathNav: () => import("./FilePathNav"),
    FooterPanel: () => import("./FooterPanel")
  },
  data() {
    return {
      showFolder: true,
      showFile: true,
      folders: [
        {
          title: "测试",
          subtitle: "相关信息"
        }
      ],
      files: [
        {
          title: "测试",
          subtitle: "相关信息",
          icon: "mdi-information",
          color: "red"
        }
      ]
    };
  },
  computed: mapState(["filePathList", "fileList", "folderList"]),
  created() {
    this.initData();
  },
  methods: {
    ...mapActions(["getFileList", "operationFile"]),
    initData() {
      this.getFileList([]);
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
          name
        }
      });
    },
    deleteClick({ name }) {
      this.operationFile({ type: "delete", name })
    }
  }
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