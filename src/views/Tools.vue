<template>
  <v-container>
    <AppBar
      color="blue-grey"
      title="工具箱"
    />
    <v-card elevation="2">
      <v-list
        subheader
        two-line
      >
        <v-list-item>
          <v-list-item-avatar>
            <v-icon
              class="grey lighten-1"
              dark
            >
              mdi-github
            </v-icon>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title>
              <v-text-field
                label="GitHub地址"
                v-model.trim="githubUrl"
              ></v-text-field>
            </v-list-item-title>
            <v-list-item-subtitle>
              CDN地址：<a
                class="text-decoration-none"
                :href="jsdelivrUrl"
                target="_blank"
              >{{jsdelivrUrl}}</a>
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>
<script>
export default {
  data() {
    return {
      githubUrl: ""
    };
  },
  computed: {
    jsdelivrUrl() {
      return this.githubUrl
        .replace("https://github.com", "https://cdn.jsdelivr.net/gh")
        .replace("/blob/", "@");
    }
  }
};
</script>

