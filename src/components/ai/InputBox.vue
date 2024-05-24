<template>
    <div class="input-box">
        <a-input v-model:value="inputText" placeholder="Type a message..." />
        <a-button @click="handleSend">Send</a-button>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const inputText = ref('');
const emit = defineEmits(['send']);

const handleSend = () => {
    if (inputText.value.trim()) {
        emit('send', inputText.value);
        inputText.value = ''; // 清空输入框
    }
};
</script>

<style scoped>
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

.message {
	display: flex;
	margin-bottom: 10px;
}

.message-text, .message-image {
	max-width: 60%;
	padding: 10px;
	border-radius: 10px;
}

.message-text {
	background-color: #f3f3f3;
}

.message-image img {
	max-width: 100%;
	border-radius: 10px;
}

.message.sender {
	justify-content: flex-end;
}

.message.sender .message-text {
	background-color: #b3e5fc;
}

.message:not(.sender) {
	justify-content: flex-start;
}

/* 其他类型消息的样式可以根据需要添加 */
</style>
