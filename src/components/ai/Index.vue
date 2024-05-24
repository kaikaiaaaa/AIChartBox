<template>
	<div class="chat-container">
		<div class="messages">
			<!--			<RecycleScroller   class="scroller"-->
			<!--							   :items="messages"-->
			<!--							   :item-size="32"-->
			<!--							   key-field="id"-->
			<!--							   v-slot="{ item }">-->
			<!--					<message-item-->
			<!--						:key="item.id"-->
			<!--						:message="item"-->
			<!--						:is-sender="isSender(item)"-->
			<!--					/>-->
			<!--			</RecycleScroller>-->
			<message-item
				v-for="item in messages"
				:key="item.id"
				:message="item"
				:is-sender="isSender(item)"
			/>

		</div>
		<input-box @send="handleSendMessage"/>
	</div>
</template>

<script setup>
import {ref} from 'vue';
import MessageItem from './MessageItem.vue';
import InputBox from './InputBox.vue';


// 模拟数据
const messages = ref([
	// ... 其他类型的消息
	{
		id: 1,
		content: [
			{
				"type": "text",
				"content": "这是一段文字描述。"
			},
			{
				"type": "text-image",
				"content": "https://example.com/image.jpg"
			},
			{
				"type": "text-video",
				"content": "https://example.com/image.jpg"
			},
		],
		sender: false // 是否是发送者
	},
	{
		id: 2,
		content: [
			{
				"type": "text",
				"content": "这是一段文字描述。"
			},
			{
				"type": "text",
				"content": "这是一段文字描述。"
			},
		],
		sender: true // 是否是发送者
	},
]);

// 输入框绑定的数据
const inputText = ref('');

// 模拟API调用
const simulateApiCall = async (text) => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, 2000); // 模拟2秒的延迟
	});
};

// 发送消息的函数
const handleSendMessage = async (text) => {
	if (text) {
		// 将消息添加到列表中，并设置为加载状态
		messages.value.push({
			id: messages.value.length + 1,
			content: [
				{
					type: 'loading',
					content: '正在生成...',
				}
			],
			sender: true,
		});

		// 模拟异步操作，例如API请求
		await simulateApiCall(text);

		// 将加载状态的消息替换为实际的消息
		const lastMessageIndex = messages.value.length - 1;
		messages.value[lastMessageIndex] = {
			id: messages.value[lastMessageIndex].id,
			content: [
				{
					type: 'text',
					content: '这是返回的消息'
				}
			],
			sender: true,
		};
		inputText.value = ''; // 清空输入框
	}
};

// 判断消息是发送者还是接收者
const isSender = (msg) => msg.sender;
</script>

<style scoped>
.scroller {
	height: 600px;
}

.chat-container {
	display: flex;
	flex-direction: column;
	height: 100%;
}

.messages {
	flex: 1;
	overflow-y: auto;
	padding: 10px;
}

.input-box {
	padding: 10px;
	display: flex;
	align-items: center;
}

.input-box input {
	flex: 1;
	margin-right: 10px;
}


.message-image img {
	max-width: 100%;
	border-radius: 10px;
}


/* 其他类型消息的样式可以根据需要添加 */
</style>
