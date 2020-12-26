<template>
  <v-dialog
    v-model="dialog"
    width="500"
  >
    <v-card>
      <v-card-title>
        上传文件夹
      </v-card-title>

      <v-card-text>
        <v-form>
          <v-file-input
            label="选择上传文件夹"
            webkitdirectory
            v-model="files"
          ></v-file-input>
        </v-form>
        <span class="red--text">
          注意：上传文件会覆盖已有文件
        </span>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          text
          @click="saveClick"
        >
          保存
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
import { mapGetters, mapActions } from "vuex";
export default {
  data() {
    return {
      dialog: false,
      files: null
    };
  },
  computed: mapGetters(["getFilePath"]),
  methods: {
    ...mapActions(["operationFile"]),
    show() {
      this.dialog = true;
    },
    saveClick() {
      const { files } = this;
      if (!files) {
        return this.$toast("请选择文件夹");
      }

      const arr = [];
      for (let file of this.file) {
        let formData = new FormData();
        formData.append("filePath", this.getFilePath(file.webkitRelativePath));
        formData.append("file", file);
        arr.push(window.ha.post(formData));
      }

      Promise.all(arr).then(() => {
        this.$toast("上传成功");
      });
    }
  }
};
</script>
