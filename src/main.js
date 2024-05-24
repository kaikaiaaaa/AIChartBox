import { createApp } from 'vue'
import App from './App.vue'
import * as echarts from 'echarts';
import VueVirtualScroller from 'vue3-virtual-scroller'
import 'vue3-virtual-scroller/dist/vue3-virtual-scroller.css'

const app = createApp(App);
app.use(VueVirtualScroller)
app.config.globalProperties.$echarts = echarts;
app.mount('#app')
