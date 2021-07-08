<template>
  <v-dialog v-model="dialog" width="500">
    <v-card>
      <v-card-title> 添加GitHub蓝图 </v-card-title>

      <v-card-text>
        <v-form @submit="saveClick">
          <v-text-field
            label="GitHub地址"
            v-model.trim="url"
            :autofocus="true"
          ></v-text-field>
        </v-form>
        <span class="red--text">
          注意：请确保引入的是正确的蓝图文件，我反正不管校验
        </span>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text :loading="loading" @click="saveClick">
          保存
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
      loading: false,
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
        return this.$toast("请输入GitHub地址");
      }
      this.loading = true;
      this.fetchApi({
        type: "install-blueprint",
        url,
      })
        .then(({ msg, code }) => {
          this.$toast(msg);
          if (code === 0) {
            this.dialog = false;
            this.$store.dispatch("getFileList", this.$store.state.filePathList);
          }
        })
        .finally(() => {
          this.loading = false;
        });
    },
  },
};
</script>
