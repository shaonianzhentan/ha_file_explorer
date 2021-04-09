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
      <v-btn
        text
        v-show="showSave"
        @click="saveClick"
      >
        <v-icon>mdi-content-save</v-icon>保存
      </v-btn>
      <v-btn
        dark
        icon
        @click="toggleSidebar"
      >
        <v-icon>{{showSidebar ? 'mdi-menu-open' : 'mdi-menu'}}</v-icon>
      </v-btn>
    </v-app-bar>
    <div
      id="editor-panel"
      style="width:100%; height:calc(100vh - 65px);padding-top:2px;"
    ></div>
  </div>
</template>
<script>
import { mapGetters, mapState, mapMutations } from "vuex";
export default {
  data() {
    return {
      showSave: false,
      loading: false,
      name: ""
    };
  },
  computed: {
    ...mapGetters(["getFilePath"]),
    ...mapState(["showSidebar"])
  },
  activated() {
    this.loadData();
  },
  beforeRouteEnter(to, from, next) {
    next(vm => {
      document.addEventListener("keydown", vm.autoSaveKeydown, false);
    });
  },
  beforeRouteLeave(to, from, next) {
    document.removeEventListener("keydown", this.autoSaveKeydown);
    next();
  },
  methods: {
    ...mapMutations(["toggleSidebar"]),
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
            // console.log(mode);
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
      if (this.loading) return;
      this.loading = true;
      let data = window.editor.getValue();
      window.ha
        .post({
          type: "new-file",
          path: this.getFilePath(this.name),
          data
        })
        .then(res => {
          this.$toast(res.msg);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    autoSaveKeydown(event) {
      if (event.ctrlKey && event.key === "s") {
        this.$toast("正在保存中...");
        this.saveClick();
        event.preventDefault();
      }
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
