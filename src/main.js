import { createApp } from 'vue'
import App from './App.vue'
import * as echarts from 'echarts';
import VueVirtualScroller from 'vue3-virtual-scroller'
import 'vue3-virtual-scroller/dist/vue3-virtual-scroller.css'
import '@/assets/reset.css'
import 'ant-design-vue/dist/reset.css';
import Antd from 'ant-design-vue';


const app = createApp(App);
app.use(VueVirtualScroller);
app.use(Antd);
app.config.globalProperties.$echarts = echarts;
app.mount('#app')
