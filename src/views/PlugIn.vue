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

            <v-toolbar-title>插件列表</v-toolbar-title>

            <v-spacer></v-spacer>

        </v-toolbar>

        <v-list
            subheader
            two-line
        >
            <v-subheader inset>我的插件</v-subheader>

            <v-list-item
                v-for="item in mylist"
                :key="item.title"
            >
                <v-list-item-avatar>
                    <v-icon
                        class="green lighten-1"
                        dark
                    >
                        mdi-github
                    </v-icon>
                </v-list-item-avatar>

                <v-list-item-content>
                    <v-list-item-title v-text="item.name"></v-list-item-title>

                    <v-list-item-subtitle v-text="item.url"></v-list-item-subtitle>
                </v-list-item-content>

                <v-list-item-action>
                    <v-tooltip left>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn
                                icon
                                v-bind="attrs"
                                v-on="on"
                                @click="pullClick(item)"
                            >
                                <v-icon color="grey lighten-1">mdi-download</v-icon>
                            </v-btn>
                        </template>
                        <span>安装最新组件</span>
                    </v-tooltip>
                </v-list-item-action>
            </v-list-item>

            <v-divider inset></v-divider>

            <v-subheader inset>收藏插件</v-subheader>

            <v-list-item
                v-for="item in list"
                :key="item.title"
            >
                <v-list-item-avatar>
                    <v-icon
                        class="blue lighten-1"
                        dark
                    >
                        mdi-github
                    </v-icon>
                </v-list-item-avatar>

                <v-list-item-content>
                    <v-list-item-title v-text="item.name"></v-list-item-title>

                    <v-list-item-subtitle v-text="item.url"></v-list-item-subtitle>
                </v-list-item-content>

                <v-list-item-action>
                    <v-tooltip left>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn
                                icon
                                v-bind="attrs"
                                v-on="on"
                                @click="pullClick(item)"
                            >
                                <v-icon color="grey lighten-1">mdi-download</v-icon>
                            </v-btn>
                        </template>
                        <span>安装最新组件</span>
                    </v-tooltip>
                </v-list-item-action>
            </v-list-item>
        </v-list>
    </v-card>

</template>
<script>
import { mapActions } from "vuex";
export default {
  data() {
    return {
      mylist: [
        {
          domain: "ha_cloud_music",
          name: "网易云音乐",
          url: "https://github.com/shaonianzhentan/ha_cloud_music"
        },
        {
          domain: "conversation",
          name: "语音小助手",
          url: "https://github.com/shaonianzhentan/conversation"
        },
        {
          domain: "ha_baidu_map",
          name: "百度地图",
          url: "https://github.com/shaonianzhentan/ha_baidu_map"
        },
        {
          domain: "ha_sidebar",
          name: "侧边栏管理",
          url: "https://github.com/shaonianzhentan/ha_sidebar"
        },
        {
          domain: "ha_file_explorer",
          name: "文件管理",
          url: "https://github.com/shaonianzhentan/ha_file_explorer"
        },
        {
          domain: "ha_qqmail",
          name: "QQ邮箱通知",
          url: "https://github.com/shaonianzhentan/ha_qqmail"
        },
        // {
        //     domain: 'ha_ble_home',
        //     name: '蓝牙在家',
        //     url: 'https://github.com/shaonianzhentan/ha_ble_home'
        // },
        {
          domain: "hf_weather",
          name: "和风天气",
          url: "https://github.com/shaonianzhentan/hf_weather"
        }
      ],
      list: [
        {
          domain: "sonoff",
          name: "SonoffLAN - 易微联",
          url: "https://github.com/AlexxIT/SonoffLAN"
        },
        {
          domain: "xiaomi_miio_airconditioningcompanion",
          name: "小米空调伴侣",
          url: "https://github.com/syssi/xiaomi_airconditioningcompanion"
        },
        {
          domain: "hacs",
          name: "HACS - 插件商店",
          url: "https://github.com/hacs/integration"
        },
        {
          domain: "havcs",
          name: "HAVCS - 智能音箱服务",
          url: "https://github.com/cnk700i/havcs"
        },
        {
          domain: "nodered",
          name: "hass-node-red",
          url: "https://github.com/zachowj/hass-node-red"
        },
        {
          domain: "ble_monitor",
          name: "米家蓝牙设备监听",
          url: "https://github.com/custom-components/ble_monitor"
        }
      ],
      pull: {
        domain: "",
        url: ""
      }
    };
  },
  methods: {
    ...mapActions(["fetchApi"]),
    backClick() {
      this.$router.back();
    },
    pullClick({ domain, url }) {
      this.fetchApi({
        type: "update",
        domain,
        url: url.replace(
          "https://github.com/",
          "https://github.com.cnpmjs.org/"
        )
      });
    }
  }
};
</script>

<style lang="less" scoped>
</style>
