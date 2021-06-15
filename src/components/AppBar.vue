<template>
    <v-app-bar
        app
        :color="color"
        dark
    >
        <v-app-bar-nav-icon @click="dockedClick">
            <v-icon>mdi-home-assistant</v-icon>
        </v-app-bar-nav-icon>
        <v-toolbar-title>{{title}}</v-toolbar-title>

        <v-spacer></v-spacer>
        <slot></slot>
        <v-btn
            dark
            icon
            @click="toggleSidebar"
        >
            <v-icon>{{showSidebar ? 'mdi-menu-open' : 'mdi-menu'}}</v-icon>
        </v-btn>
    </v-app-bar>
</template>
<script>
import { mapState, mapMutations } from "vuex";
export default {
  props: {
    title: String,
    color: {
      type: String,
      default: "primary"
    }
  },
  components: {},
  data() {
    return {};
  },
  computed: mapState(["showSidebar"]),
  methods: {
    ...mapMutations(["toggleSidebar"]),
    dockedClick() {
      window.ha.fire("hass-toggle-menu");
    }
  }
};
</script>
