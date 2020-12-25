<template>

    <v-card class="mx-auto">
        <v-toolbar
            color="light-blue"
            dark
            style="position: sticky; top: 0; z-index: 1;"
        >
            <v-btn
                dark
                icon
                @click="backClick"
            >
                <v-icon>mdi-keyboard-backspace</v-icon>
            </v-btn>

            <v-toolbar-title>备份重置</v-toolbar-title>

            <v-spacer></v-spacer>

        </v-toolbar>

    </v-card>

</template>
<script>
import { mapActions } from "vuex";
export default {
  data() {
    return {};
  },
  methods: {
    ...mapActions(["fetchApi"]),
    backClick() {
      this.$router.back();
    }
  }
};
</script>

<style lang="less" scoped>
</style>
