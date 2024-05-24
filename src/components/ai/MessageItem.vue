<template>
	<div :class="`message ${messageClass}`">
		<!-- 循环消息体：一条消息也许会有多种类型 -->
		<div class="item-box">
			<div v-for="item in props.message.content" :key="item.type" class="message-item">
				<component :is="messageComponent(item.type)" :data="item"></component>
			</div>
		</div>
	</div>
</template>

<script setup>
import {computed} from 'vue';
import TextBlock from "./chatBox/TextBlock.vue";
import TextImageBlock from "./chatBox/TextImageBlock.vue";
import LoadingBlock from "./chatBox/LoadingBlock.vue";
import TextVideoBlock from "./chatBox/TextVideoBlock.vue";

const props = defineProps({
	message: Object,
	isSender: Boolean,
});
console.log('message', props.message);

// 根据发送者和接收者来设置消息的样式类
const messageClass = computed(() => (props.isSender ? 'sender' : 'receiver'));

// 根据消息类型来选择不同的组件
function messageComponent(type) {
	console.log('type', type);
	switch (type) {
		// 纯文本组件
		case 'text':
			return TextBlock;
		// 文本+图片组件
		case 'text-image':
			return TextImageBlock;
		// loading状态
		case 'loading':
			return LoadingBlock;
		// 可以根据需要添加更多的case来处理其他类型
		case 'text-video':
			return TextVideoBlock;
		default:
			return TextBlock;
	}
}
</script>

<style scoped lang="less">

.msg-item {
	width: 100%;
}

.message-image img {
	max-width: 100%;
	display: block;
	border-radius: 10px;
}

.message.sender {
	display: flex;
	flex-direction: column;
	margin: 12px;
	justify-content: flex-end;
	align-items: end;

	& .item-box{
		display: flex;
		background: #cee8ff;
		width: max-content;
		border-radius: 12px;
		padding:12px;
		flex-direction: column;
	}


	& .message-item {

	}
}

.message.receiver {
	display: flex;
	flex-direction: column;
	margin: 12px;
	justify-content: flex-start;
	align-items: start;

	& .item-box{
		display: flex;
		background: #cee8ff;
		width: max-content;
		border-radius: 12px;
		padding:12px;
		flex-direction: column;

	}

	& .message-item {
	}
}

</style>
