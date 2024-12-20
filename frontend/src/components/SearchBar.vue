<template>
  <div class="mb-72 mt-9 p-8">
    <header class="text-center mb-8">
          <h1 class="text-6xl font-bold text-violet-icon">Nanny Search</h1>
    </header>
    <div class="flex justify-center items-center">
      <!-- Search Bar Container -->
      <div class="flex w-full max-w-2xl border rounded-full shadow-md bg-white overflow-hidden focus-within:ring-2 focus-within:ring-violet-500">
        <!-- Search Icon -->
        <div class="flex items-center justify-center px-4 cursor-pointer" @click="performSearch">
          <i class="pi pi-search text-lg  font-semibold text-violet-500 "></i>
        </div>
        <!-- Input Field -->
        <input
            type="text"
            v-model="searchQuery"
            placeholder="Search for nannies or babysitters..."
            class="flex-grow p-3 text-gray-700 bg-white focus:outline-none"
            @keydown.enter="performSearch"
        />
      </div>
    </div>
</div>
</template>

<script>
export default {
  name: "SearchBar",
  data() {
    return {
      searchQuery: "",
    };
  },
  methods: {
    performSearch() {
      if((this.searchQuery).trim().length>0){

      this.$router.push({ path: '/results', query: { query: this.searchQuery }});}
    },
  },
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>

