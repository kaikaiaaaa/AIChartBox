<template>
	<videoPlay
		v-bind="options"
		poster="https://cdn.jsdelivr.net/gh/xdlumia/files/video-play/ironMan.jpg"
	/>
</template>

<script setup>
import { videoPlay } from 'vue3-video-play/lib/index'
import 'vue3-video-play/dist/style.css'
import {onMounted, reactive} from 'vue'

const props = defineProps({
	data: Object,
});

const options = reactive({
	width: "400px", //播放器宽度
	height: "200px", //播放器高度
	color: "#409eff", //主题色
	title: "", //视频名称
	src: props.data.content || "https://cdn.jsdelivr.net/gh/xdlumia/files/video-play/IronMan.mp4", //视频源
	muted: false, //静音
	webFullScreen: false,
	speedRate: ["0.75", "1.0", "1.25", "1.5", "2.0"], //播放倍速
	autoPlay: false, //自动播放
	loop: false, //循环播放
	mirror: false, //镜像画面
	ligthOff: false, //关灯模式
	volume: 0.3, //默认音量大小
	control: true, //是否显示控制
	controlBtns: [
		"audioTrack",
		"quality",
		"speedRate",
		"volume",
		"setting",
		"pip",
		"pageFullScreen",
		"fullScreen",
	], //显示所有按钮,
});

onMounted(() => {
})

</script>

<style scoped>

</style>
