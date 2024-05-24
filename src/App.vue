<script setup>
import AI from './components/ai/Index.vue'
import {reactive} from 'vue'

const state = reactive({

})
</script>

<template>
	<main>
		<AI></AI>
	</main>
</template>

<style scoped lang="less">
main {
	height: 100vh;
	width: 100vw;
	background: #ffffff;
}

</style>
