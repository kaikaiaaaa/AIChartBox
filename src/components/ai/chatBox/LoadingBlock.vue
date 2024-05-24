<template>
	<main>{{props.data.content}}</main>
</template>

<script setup>
const props = defineProps({
	data: Object,
});

</script>

<style scoped>
main {
}
</style>
