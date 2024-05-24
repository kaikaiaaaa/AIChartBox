<template>
	<main>
		{{ props.data.content }}
		<!--		todo 可嵌套widget组件 -->
		<Actions></Actions>
	</main>

</template>

<script setup>
import Actions from "../widget/Actions.vue";
const props = defineProps({
	data: Object,
});

</script>

<style scoped lang="less">
main {
}

</style>
