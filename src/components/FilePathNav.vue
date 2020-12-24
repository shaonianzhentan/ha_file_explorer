<template>
    <v-breadcrumbs :items="items">
        <template v-slot:divider>
            <v-icon>mdi-forward</v-icon>
        </template>
    </v-breadcrumbs>
</template>
<script>
import { mapActions, mapState } from "vuex";
export default {
  data() {
    return {};
  },
  computed: mapState({
    filePathList: ({ filePathList }) => {
      return filePathList.map(ele => ele);
    },
    items: ({ filePathList }) => {
      const len = filePathList.length - 1;
      return [
        {
          text: "HA",
          disabled: false,
          href: `#/?index=-1`
        },
        ...filePathList.map((ele, index) => {
          return {
            text: ele,
            disabled: len === index,
            href: `#/?index=${index}`
          };
        })
      ];
    }
  }),
  watch: {
    $route() {
      let index = this.$route.query.index;
      if (index) {
        const arr = this.filePathList.splice(0, Number(index) + 1);
        // console.log(arr);
        this.getFileList(arr);
        location.href = "#/";
      }
    }
  },
  methods: {
    ...mapActions(["getFileList"])
  }
};
</script>
