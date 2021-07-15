<template>
  <v-dialog v-model="dialog" width="500">
    <v-card>
      <v-card-title> 新建文件 </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="saveClick">
          <v-text-field
            label="文件名"
            v-model.trim="name"
            :autofocus="true"
          ></v-text-field>
        </v-form>
        <span class="red--text"> 注意：新建文件会覆盖已有文件 </span>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="saveClick"> 保存 </v-btn>
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
    };
  },
  computed: mapGetters(["getFilePath"]),
  methods: {
    ...mapActions(["operationFile"]),
    show() {
      this.name = "";
      this.dialog = true;
    },
    saveClick() {
      const { name } = this;
      if (!name) {
        return this.$toast("请输入名称");
      }
      this.operationFile({ type: "new-file", name }).then(({ code }) => {
        if (code === 0) {
          this.dialog = false;
        }
      });
    },
  },
};
</script>
