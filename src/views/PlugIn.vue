<template>
  <div>
    <AppBar color="light-blue" title="插件列表" />

    <v-container>
      <v-list subheader two-line>
        <v-subheader inset>我的插件</v-subheader>

        <v-list-item v-for="item in mylist" :key="item.title">
          <v-list-item-avatar>
            <v-icon class="green lighten-1" dark> mdi-github </v-icon>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title v-text="item.name"></v-list-item-title>

            <v-list-item-subtitle>
              <a
                :href="item.url"
                target="_blank"
                class="text-decoration-none"
                >{{ item.url }}</a
              >
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-menu>
              <template v-slot:activator="{ on, attrs }">
                <v-btn icon v-bind="attrs" v-on="on">
                  <v-icon color="grey lighten-1">mdi-download</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item v-for="(git, index) in items" :key="index">
                  <v-list-item-title @click="pullClick(item, git.title)">{{
                    git.title
                  }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-list-item-action>
        </v-list-item>

        <v-divider inset></v-divider>

        <v-subheader inset>收藏插件</v-subheader>

        <v-list-item v-for="item in list" :key="item.title">
          <v-list-item-avatar>
            <v-icon class="blue lighten-1" dark> mdi-github </v-icon>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title v-text="item.name"></v-list-item-title>

            <v-list-item-subtitle>
              <a
                :href="item.url"
                target="_blank"
                class="text-decoration-none"
                >{{ item.url }}</a
              >
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-menu>
              <template v-slot:activator="{ on, attrs }">
                <v-btn icon v-bind="attrs" v-on="on">
                  <v-icon color="grey lighten-1">mdi-download</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item v-for="(git, index) in items" :key="index">
                  <v-list-item-title @click="pullClick(item, git.title)">{{
                    git.title
                  }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-list-item-action>
        </v-list-item>
        <v-divider inset></v-divider>
        <v-list-item>
          <v-list-item-avatar>
            <v-icon class="red lighten-1" dark> mdi-github </v-icon>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-form>
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.trim="pull.domain"
                    label="自定义组件名称"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="8">
                  <v-text-field
                    type="url"
                    v-model.trim="pull.url"
                    label="GitHub项目地址"
                    required
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-form>
          </v-list-item-content>

          <v-list-item-action>
            <v-menu>
              <template v-slot:activator="{ on, attrs }">
                <v-btn icon v-bind="attrs" v-on="on">
                  <v-icon color="grey lighten-1">mdi-download</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item v-for="(git, index) in items" :key="index">
                  <v-list-item-title @click="gitClick(git.title)">{{
                    git.title
                  }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-list-item-action>
        </v-list-item>
      </v-list>
      <v-card elevation="2" style="padding: 20px">
        <v-card-text class="text--primary">
          <p class="text-h6">
            注意：不会用千万别点下面的按钮，否则可能造成数据异常
          </p>
          修改pip的镜像源、github的域名解析、修改hacs的资源下载链接
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="updateSourceClick('pip')" text>
            pip
          </v-btn>
          <v-btn color="error" @click="updateSourceClick('github')" text>
            GitHub
          </v-btn>
          <v-btn color="error" @click="updateSourceClick('github-clear')" text>
            清除GitHub
          </v-btn>
          <v-btn color="orange" @click="updateSourceClick('hacs')" text>
            HACS
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </div>
</template>
<script>
import { mapActions } from "vuex";
export default {
  data() {
    return {
      mylist: [],
      list: [],
      pull: {
        domain: "",
        url: "",
      },
      items: [
        { title: "github.com.cnpmjs.org" },
        { title: "hub.fastgit.org" },
        { title: "github.com" },
      ],
    };
  },
  created() {
    fetch(
      `https://cdn.jsdelivr.net/gh/shaonianzhentan/ha_file_explorer@master/config/git.json?ver=${window.ha.ver}`
    )
      .then((res) => res.json())
      .then(({ my, all }) => {
        this.mylist = my;
        this.list = all;
      });
  },
  methods: {
    ...mapActions(["fetchApi"]),
    gitClick(gitUrl) {
      this.pullClick(this.pull, gitUrl);
    },
    pullClick({ domain, url }, gitUrl) {
      if (!domain || !url) {
        return this.$toast("请输入组件名称和项目地址");
      }
      // console.log(gitUrl);
      this.fetchApi({
        type: "update",
        domain,
        url: url.replace("https://github.com/", `https://${gitUrl}/`),
      }).then((res) => {
        if (res.code === 0) {
          this.$toast(res.msg);
        }
      });
    },
    updateSourceClick(url) {
      if (top.confirm("会修改系统里相关文件配置，不懂千万别确定")) {
        this.fetchApi({
          type: "update-source",
          url,
        }).then((res) => {
          this.$toast(res.msg);
        });
      }
    },
  },
};
</script>

<style lang="less" scoped>
</style>
