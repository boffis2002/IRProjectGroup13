<template>
  <div :class="containerClass">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  computed: {
    containerClass() {
      return this.$route.path === '/results' ? 'bg-violet-50 min-h-screen' : 'bg-violet-50 min-h-screen flex flex-col justify-center';
    },
  },
};
</script>

<style scoped>
</style>
