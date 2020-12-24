<template>
  <v-app>
    <!-- loading -->
    <v-overlay :value="loading">
      <v-progress-circular
        indeterminate
        size="64"
      ></v-progress-circular>
    </v-overlay>
    <!-- toast -->
    <v-snackbar v-model="snackbar.show">
      {{ snackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn
          color="pink"
          text
          v-bind="attrs"
          @click="snackbar.show = false"
        >
          关闭
        </v-btn>
      </template>
    </v-snackbar>
    <v-main>
      <keep-alive>
        <router-view></router-view>
      </keep-alive>
    </v-main>
  </v-app>
</template>

<script>
import Vue from "vue";
import { mapState } from "vuex";
export default {
  name: "App",
  data: () => ({
    snackbar: {
      text: "",
      show: false
    }
  }),
  computed: mapState(["loading"]),
  beforeCreate() {
    Vue.$toast = Vue.prototype.$toast = text => {
      this.snackbar.text = text;
      this.snackbar.show = true;
    };
  }
};
</script>
