<template>
  <v-dialog
    v-model="dialog"
    width="500"
  >
    <v-card>
      <v-card-title>
        上传文件
      </v-card-title>

      <v-card-text>
        <v-form>
          <v-file-input
            label="选择上传文件"
            @change="selectFile"
          ></v-file-input>
          <v-text-field
            label="上传文件名"
            v-model.trim="name"
          ></v-text-field>
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
      name: "",
      file: null
    };
  },
  computed: mapGetters(["getFilePath"]),
  methods: {
    ...mapActions(["operationFile"]),
    show() {
      this.name = "";
      this.dialog = true;
    },
    selectFile(file) {
      if (file) {
        this.name = file.name;
      }
      this.file = file;
    },
    saveClick() {
      const { name, file, getFilePath } = this;
      if (!name) {
        return this.$toast("请输入名称");
      }
      const formData = new FormData();
      formData.append("filePath", getFilePath(name));
      formData.append("file", file);
      window.ha.put(formData).then(({ code, msg }) => {
        this.$toast(msg);
        if (code === 0) {
          this.dialog = false;
        }
      });
    }
  }
};
</script>
