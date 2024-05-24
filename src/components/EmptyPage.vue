<template>
    <div class="empty-box">
        <img :src="img" alt="">
        <label>{{ message }}</label>
    </div>
</template>

<script>
export default {
    name: 'EmptyPage',
    props: {
        img: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        }
    }
};
</script>

<style scoped>
.empty-box {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    height: 100%;
}

img {
    margin-bottom: 16px;
    width: 100px;
    height: 100px;
}

label {
    display: flex;
    justify-content: center;
    font-size: 14px;
    font-family: HarmonyOS;
    line-height: 21px;
    color: rgba(0, 7, 30, 0.45);
}

</style>
