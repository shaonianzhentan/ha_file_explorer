<template>
  <v-dialog v-model="dialog" width="500">
    <v-card>
      <v-card-title> 下载网络文件 </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="saveClick">
          <v-text-field
            label="URL地址"
            v-model.trim="url"
            :autofocus="true"
          ></v-text-field>
        </v-form>
        <span class="red--text">
          警告：大文件、资源加载慢等链接可能会导致主程序卡死，也就是说HA会搞崩溃，使用前请先确定？</span
        >
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="saveClick">
          下载到当前文件夹
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
import { mapActions } from "vuex";
export default {
  data() {
    return {
      dialog: false,
      url: "",
    };
  },
  methods: {
    ...mapActions(["fetchApi"]),
    show() {
      this.url = "";
      this.dialog = true;
    },
    saveClick() {
      const { url } = this;
      if (!url) {
        return this.$toast("请输入下载地址");
      }
      const { filePathList } = this.$store.state;
      console.log(filePathList);
      this.fetchApi({
        type: "download-url",
        path: filePathList.join("/"),
        url,
      }).then(({ msg, code }) => {
        this.$toast(msg);
        if (code === 0) {
          this.dialog = false;
          this.$store.dispatch("getFileList", filePathList);
        }
      });
    },
  },
};
</script>
