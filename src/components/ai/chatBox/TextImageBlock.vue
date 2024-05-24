<template>
	<main>
		<img :src="props.data.content" alt="">
		<label>{{ props.data.content }}</label>
	</main>
</template>

<script setup>
const props = defineProps({
	data: Object,
});


</script>

<style scoped lang="less">
main{
}

</style>
