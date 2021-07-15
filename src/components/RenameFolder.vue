<template>
  <v-dialog
    v-model="dialog"
    width="500"
  >
    <v-card>
      <v-card-title>
        重命名文件夹
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="saveClick">
          <v-text-field
            label="新文件夹名称"
            v-model.trim="name"
            :autofocus="true"
          ></v-text-field>
        </v-form>
        <span class="red--text">
          注意：别乱改系统文件夹
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
import { mapGetters, mapState, mapActions } from "vuex";
export default {
  data() {
    return {
      dialog: false,
      name: ""
    };
  },
  computed: {
    ...mapState(["filePathList"]),
    ...mapGetters(["getFilePath"])
  },
  methods: {
    ...mapActions(["operationFile"]),
    show() {
      const { filePathList } = this;
      this.name = filePathList[filePathList.length - 1];
      this.dialog = true;
    },
    saveClick() {
      const { name, filePathList } = this;
      if (!name) {
        return this.$toast("请输入名称");
      }
      const arr = JSON.parse(JSON.stringify(filePathList));
      arr[arr.length - 1] = name;
      const rename_path = arr.join("/");
      this.operationFile({
        type: "rename",
        rename_path
      }).then(({ code }) => {
        if (code === 0) {
          this.dialog = false;
        }
      });
    }
  }
};
</script>
