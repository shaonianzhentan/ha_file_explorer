<template>
    <v-footer padless>
        <v-card
            flat
            tile
            class="text-center"
            style="width:100%;"
        >
            <v-card-text>

                <v-tooltip top>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn
                            class="mx-4"
                            icon
                            href="https://shaonianzhentan.github.io/ha-docs/#/"
                            target="_blank"
                            v-bind="attrs"
                            v-on="on"
                        >
                            <v-icon size="24px">
                                mdi-book-edit
                            </v-icon>
                        </v-btn>
                    </template>
                    <span>Home Assistant 学习笔记</span>
                </v-tooltip>

                <v-tooltip top>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn
                            class="mx-4"
                            icon
                            href="https://space.bilibili.com/39523884"
                            target="_blank"
                            v-bind="attrs"
                            v-on="on"
                        >
                            <v-icon size="24px">
                                mdi-file-video
                            </v-icon>
                        </v-btn>
                    </template>
                    <span>Home Assistant 视频学习记录</span>
                </v-tooltip>

                <v-tooltip top>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn
                            class="mx-4"
                            icon
                            href="https://github.com/shaonianzhentan/ha_file_explorer"
                            target="_blank"
                            v-bind="attrs"
                            v-on="on"
                        >
                            <v-icon size="24px">
                                mdi-github
                            </v-icon>
                        </v-btn>
                    </template>
                    <span>GitHub项目地址</span>
                </v-tooltip>
                <v-tooltip top>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn
                            class="mx-4"
                            icon
                            href="https://www.home-assistant.io/"
                            target="_blank"
                            v-bind="attrs"
                            v-on="on"
                        >
                            <v-icon size="24px">
                                mdi-home-assistant
                            </v-icon>
                        </v-btn>
                    </template>
                    <span>Home Assistant 官网</span>
                </v-tooltip>

                <v-tooltip top>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn
                            class="mx-4"
                            icon
                            href="https://unpkg.com/@mdi/font@5.8.55/preview.html"
                            target="_blank"
                            v-bind="attrs"
                            v-on="on"
                        >
                            <v-icon size="24px">
                                mdi-format-font
                            </v-icon>
                        </v-btn>
                    </template>
                    <span>MDI图标预览</span>
                </v-tooltip>

                <v-tooltip top>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn
                            class="mx-4"
                            icon
                            href="https://www.npmjs.com/package/@mdi/font"
                            target="_blank"
                            v-bind="attrs"
                            v-on="on"
                        >
                            <v-icon size="24px">
                                mdi-npm
                            </v-icon>
                        </v-btn>
                    </template>
                    <span>MDI图标NPM包</span>
                </v-tooltip>

                <v-tooltip top>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn
                            class="mx-4"
                            icon
                            href="https://vuetifyjs.com/zh-Hans/"
                            target="_blank"
                            v-bind="attrs"
                            v-on="on"
                        >
                            <v-icon size="24px">
                                mdi-vuetify
                            </v-icon>
                        </v-btn>
                    </template>
                    <span>前端UI框架 - Vuetify</span>
                </v-tooltip>

            </v-card-text>

            <v-card-text class="pt-0">
                如果你觉得这个项目对你的帮助，请在GitHub上给这个项目一个Star
            </v-card-text>

            <v-divider></v-divider>

            <v-card-text>
                {{ new Date().getFullYear() }} — <strong>版本：{{ver}}</strong>
            </v-card-text>
        </v-card>
    </v-footer>
</template>
<script>
export default {
  data() {
    return {
      ver: window.ha.ver || "测试版"
    };
  }
};
</script>
