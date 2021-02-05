<template>
  <v-row justify="center">
    <v-dialog
      v-model="dialog"
      scrollable
      :persistent="true"
      max-width="600"
    >]
      <v-card>
        <v-card-title>还原备份文件</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row
            justify="center"
            style="padding:20px 0;"
          >
            <v-progress-circular
              indeterminate
              color="primary"
              v-show="items.length === 0"
            ></v-progress-circular>
          </v-row>
          <v-treeview
            v-model="selected"
            item-key="url"
            item-children="child"
            selectable
            :items="items"
          ></v-treeview>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn
            color="blue darken-1"
            text
            @click="dialog = false"
          >
            关闭
          </v-btn>
          <v-btn
            color="blue darken-1"
            text
            @click="submit"
          >
            恢复选中文件
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>
<script>
import { mapActions } from "vuex";
export default {
  data() {
    return {
      dialog: false,
      selected: [],
      items: []
    };
  },
  methods: {
    ...mapActions(["fetchApi"]),
    show(url) {
      this.items = [];
      this.dialog = true;
      this.fetchApi({
        type: "download-tmpfile",
        url
      }).then(({ msg, code, data }) => {
        if (code === 0) {
          this.items = data;
        } else {
          this.$toast(msg);
        }
      });
    },
    submit() {
      const { selected } = this;
      if (selected.length === 0) {
        return this.$toast("请选择还原文件");
      }
      this.fetchApi({
        type: "move-tmpfile",
        list: selected
      }).then(({ msg }) => {
        this.$toast(msg);
      });
    }
  }
};
</script>
