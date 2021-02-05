<template>
  <v-dialog
    v-model="dialog"
    width="500"
  >
    <v-card>
      <v-card-title>
        重命名文件
      </v-card-title>

      <v-card-text>
        <v-form>
          <v-text-field
            label="新文件名"
            v-model.trim="name"
            @keyup.enter="saveClick"
          ></v-text-field>
        </v-form>
        <span class="red--text">
          注意：重命名文件不能与现有文件相同
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
      sourceFileName: "",
      name: ""
    };
  },
  computed: mapGetters(["getFilePath"]),
  methods: {
    ...mapActions(["operationFile"]),
    show(name) {
      this.sourceFileName = name;
      this.name = name;
      this.dialog = true;
    },
    saveClick() {
      const { sourceFileName, name } = this;
      if (!name) {
        return this.$toast("请输入名称");
      }
      const rename_path = this.getFilePath(name);
      this.operationFile({
        type: "rename",
        name: sourceFileName,
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
