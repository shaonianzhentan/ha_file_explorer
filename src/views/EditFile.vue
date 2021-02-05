<template>
  <div>
    <v-app-bar
      app
      color="primary"
      dark
    >
      <div class="d-flex align-center">
        <v-btn
          dark
          icon
          @click="backClick"
        >
          <v-icon>mdi-keyboard-backspace</v-icon>
        </v-btn>
        {{ name }}
      </div>
      <v-spacer></v-spacer>
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
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="callService('script.reload')">
            <v-list-item-title>重载脚本</v-list-item-title>
          </v-list-item>
          <v-list-item @click="callService('scene.reload')">
            <v-list-item-title>重载场景</v-list-item-title>
          </v-list-item>
          <v-list-item @click="callService('automation.reload')">
            <v-list-item-title>重载自动化</v-list-item-title>
          </v-list-item>
          <v-list-item @click="callService('python_script.reload')">
            <v-list-item-title>重载Python Script</v-list-item-title>
          </v-list-item>
          <v-list-item @click="callService('group.reload')">
            <v-list-item-title>重载分组及通知服务</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item @click="callService('homeassistant.restart')">
            <v-list-item-title>重新启动HA</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-btn
        text
        v-show="showSave"
        @click="saveClick"
      >
        <v-icon>mdi-content-save</v-icon>保存
      </v-btn>
    </v-app-bar>
    <div
      id="editor-panel"
      style="width:100%; height:calc(100vh - 65px);padding-top:2px;"
    ></div>
  </div>
</template>
<script>
import { mapGetters } from "vuex";
export default {
  data() {
    return {
      showSave: false,
      name: ""
    };
  },
  computed: mapGetters(["getFilePath"]),
  activated() {
    this.loadData();
  },
  methods: {
    loadData() {
      const { name } = this.$route.params;
      if (!name) {
        return this.$router.back();
      }
      this.name = name;
      this.$nextTick(() => {
        this.showSave = false;
        // 清空内容
        document.querySelector(
          "#editor-panel"
        ).innerHTML = `<pre id="editor" style="width:100%;height:100%;" ></pre>`;
        // 请求内容
        window.ha
          .post({
            type: "get-content",
            path: this.getFilePath(name)
          })
          .then(({ code, data, msg }) => {
            if (code > 0) {
              return this.$toast(msg);
            }
            document.querySelector("#editor").textContent = data;
            // 获取后缀
            let arr = name.split(".");
            let ext = "text";
            if (arr.length > 1) {
              ext = arr[arr.length - 1].toLocaleLowerCase();
            }
            if (["js", "ts", "jsx"].includes(ext)) {
              ext = "javascript";
            }
            if (["py", "pyc"].includes(ext)) {
              ext = "python";
            }
            let mode = `ace/mode/${ext}`;
            console.log(mode);
            window.editor = window.ace.edit("editor", {
              theme: "ace/theme/chrome",
              mode
            });
            this.showSave = true;
            document.body.scrollIntoView();
          });
      });
    },
    saveClick() {
      let data = window.editor.getValue();
      window.ha
        .post({
          type: "new-file",
          path: this.getFilePath(this.name),
          data
        })
        .then(res => {
          this.$toast(res.msg);
        });
    },
    callService(service) {
      window.ha.callService(service);
      this.$toast(`调用服务${service}`);
    },
    backClick() {
      this.$router.back();
    }
  }
};
</script>

<style lang="less" scoped>
/deep/ .ace_print-margin-layer {
  display: none;
}
</style>
