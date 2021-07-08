<template>
  <div>
    <v-breadcrumbs :items="items">
      <template v-slot:divider>
        <v-icon>mdi-forward</v-icon>
      </template>
    </v-breadcrumbs>
    <v-btn
      class="mx-2"
      fab
      dark
      small
      color="indigo"
      style="float: right; margin-top: -50px"
      v-if="isAction"
      @click="actionClick"
    >
      <v-icon dark> mdi-plus </v-icon>
    </v-btn>
    <AddBluePrint ref="AddBluePrint" />
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";
export default {
  components: {
    AddBluePrint: () => import("./AddBluePrint"),
  },
  data() {
    return {};
  },
  computed: {
    ...mapState({
      filePathList: ({ filePathList }) => {
        return filePathList.map((ele) => ele);
      },
      items: ({ filePathList }) => {
        // const len = filePathList.length - 1;
        return [
          {
            text: "HA",
            disabled: false,
            href: `#/?index=-1`,
          },
          ...filePathList.map((ele, index) => {
            return {
              text: ele,
              href: `#/?index=${index}`,
            };
          }),
        ];
      },
    }),
    isAction() {
      return this.filePathList.join("/").indexOf("blueprints/automation") === 0;
    },
  },
  watch: {
    $route() {
      let index = this.$route.query.index;
      if (index) {
        const arr = this.filePathList.splice(0, Number(index) + 1);
        // console.log(arr);
        this.getFileList(arr);
        location.href = "#/";
      }
    },
  },
  methods: {
    ...mapActions(["getFileList"]),
    actionClick() {
      this.$refs.AddBluePrint.show();
    },
  },
};
</script>
