<template>
  <v-container>
    <AppBar
      color="deep-purple"
      title="云备份"
    />
    <v-card elevation="2">
      <v-list
        subheader
        two-line
      >
        <v-subheader
          inset
          @click="loadData"
        >文件列表</v-subheader>
        <v-list-item
          v-for="(item) in fileList"
          :key="item.name"
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
            <v-list-item-subtitle>
              <span class="text--disabled">{{item.edit}}</span>
              <span class="font-weight-light"> — {{item.sizeName | fileSizeFormat}}</span>
            </v-list-item-subtitle>
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
                <v-list-item @click="deleteClick(item)">
                  <v-list-item-title>删除</v-list-item-title>
                </v-list-item>

                <v-list-item
                  :href="item.url"
                  target="_blank"
                >
                  <v-list-item-title>下载文件</v-list-item-title>
                </v-list-item>

              </v-list>
            </v-menu>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>
<script>
import { mapActions } from "vuex";
export default {
  data() {
    return {
      fileList: []
    };
  },
  activated() {
    this.loadData();
  },
  methods: {
    ...mapActions(["fetchApi"]),
    loadData() {
      this.fetchApi({
        type: "qn-list"
      }).then(({ data }) => {
        console.log(data);
        this.fileList = data.list.items.map(ele => {
          return {
            name: ele.key,
            edit: new Date(
              Number(String(ele.putTime).substr(0, 13))
            ).toLocaleString(),
            sizeName: ele.fsize,
            color: "blue",
            icon: "mdi-file",
            url: `${data.download}${ele.key}`
          };
        });
      });
    },
    deleteClick(item) {
      this.fetchApi({
        type: "qn-delete",
        key: item.name
      }).then(({ msg }) => {
        this.$toast(msg);
        this.loadData();
      });
    }
  }
};
</script>

<style lang="less" scoped>
</style>
