<template>
  <div class="flex flex-col min-h-screen">
    <!-- Search Bar -->
    <header :class="['fixed top-0 left-0 w-full p-4 pl-16 pr-16 bg-violet-50 z-50', shadowClass]">
      <div class="flex items-center">
        <div class="flex w-full max-w-2xl border rounded-full shadow-md bg-white overflow-hidden focus-within:ring-2 focus-within:ring-violet-500">
          <!-- Search Icon -->
          <div class="flex items-center justify-center px-4 cursor-pointer" @click="performSearch">
            <i class="pi pi-search text-lg font-semibold text-violet-500"></i>
          </div>
          <!-- Input Field -->
          <input
              ref="searchInput"
              type="text"
              v-model="localSearchQuery"
              class="flex-grow p-3 text-gray-700 bg-white focus:outline-none"
              @keydown.enter="performSearch"
          />
          <!-- Delete Icon -->
          <div
              class="flex items-center justify-center px-8 cursor-pointer"
              @click="clearSearch"
              v-if="localSearchQuery !== ''"
          >
            <i class="pi pi-times text-lg font-semibold text-violet-500"></i>
          </div>
        </div>

          <div v-if="showFilters" class="flex items-center space-x-4 ml-4">
          <!-- Age Slider -->
          <div class="flex items-center">
            <label class="mr-4 text-gray-700">Age:</label>
            <Slider
              v-model="ageRange"
              range
              class="w-40"
              :min="computedMinAge"
              :max="computedMaxAge"
              :disabled="minAge === maxAge"
              @change="updateFilters"
            />
            <span class="ml-4 text-gray-600" >{{ ageRange[0] }} - {{ ageRange[1] }}</span>
          </div>
          <!-- Salary Slider -->
          <div class="flex items-center">
            <label class="mr-4 text-gray-700">Salary:</label>
            <Slider
              v-model="salaryRange"
              range
              class="w-40"
              :min="computedMinSalary"
              :max="computedMaxSalary"
              :disabled="minSalary === maxSalary"
              @change="updateFilters"
            />
            <span class="ml-4 text-gray-600">{{ salaryRange[0] }} - {{ salaryRange[1] }}</span> 
          </div>
        </div>
      </div>
    </header>

    <div class="flex-grow pt-24">
    <!-- No Results Found -->
    <div v-if="isResultsEmpty" class="flex flex-col items-start p-10">
      <h3 class="font-bold text-2xl pl-16 pr-16 text-gray-700 mb-6">
        Looks like there aren't any matches for your search
      </h3>
      <div class="pl-16 pr-16 ml-4 text-xl text-gray-700">
        Search tips:
      </div>
      <ul class="pl-16 pr-16 ml-12 list-disc text-lg text-gray-700 mt-6 space-y-4">
        <li>Make sure all words are spelled correctly</li>
        <li>Try using different keywords</li>
        <li>Try changing the range of age or salary</li>
      </ul>
    </div>


    <div v-if="isLoading" class="flex justify-center items-center flex-grow">
      <i class="pi pi-spin pi-spinner font-extrabold text-violet-500"></i> 
      <p class="ml-2 text-xl text-gray-700">Loading...</p>
    </div>

    
    <!-- Search Results Section -->
    <main v-else class="flex space-x-4 pl-20 flex-grow">

      <!-- Search Results -->
      <div class="flex-1" v-if="!isResultsEmpty">
        <h2 class="text-lg font-semibold text-gray-800 mb-3">
          Search Results for "{{ displayQuery }}"
        </h2>
        <ul class="space-y-4">
          <li
              v-for="result in results"
              :key="result.href"
              class="p-4 border rounded-md shadow-sm bg-white relative"
          >
            <h3 class="font-bold text-violet-600">
              <a :href="result.href" target="_blank">{{ result.name }}</a>
            </h3>
            <div class="flex items-center text-gray-600 mt-4 mb-4 relative">
              <p class="w-4/5 mb-4" v-html="result.description"></p>

              <!-- Divider -->
              <div class="border-l border-gray-300 mx-2 self-stretch"></div>

              <!-- Age e Salary -->
              <div class="min-width-150 flex flex-col justify-center">
                <div class="age-salary ml-4">
                  <p class="text-violet-600"> Age: {{ result.age }}</p>
                  <p class="text-violet-600">Salary: {{ result.salary }} CHF/hr</p>
                </div>
              </div>
            </div>

            <!-- URL in basso a sinistra -->
            <div class="text-sm text-gray-500 absolute bottom-4 left-4">
              <a :href="result.url" target="_blank" class="hover:underline">{{ result.url }}</a>
            </div>

            <!-- Like e Dislike -->
            <div class="like-dislike absolute top-4 right-4 flex space-x-2">
              <i
                  class="pi pi-thumbs-up"
                  :class="{ 'text-green-500': result.selectedFeedback === 'like', 'text-gray-500': result.selectedFeedback !== 'like' }"
                  @click="handleFeedback(result, 'like')"
              ></i>
              <i
                  class="pi pi-thumbs-down"
                  :class="{ 'text-red-500': result.selectedFeedback === 'dislike', 'text-gray-500': result.selectedFeedback !== 'dislike' }"
                  @click="handleFeedback(result, 'dislike')"
              ></i>
            </div>

          </li>
        </ul>


      </div>

      <!-- Divider -->
      <div v-if="suggestions.length == 1 && !isResultsEmpty && currentPage === 1" class="h-[220px] border-l border-gray-300"></div>
      <div v-if="suggestions.length == 2 && !isResultsEmpty && currentPage === 1" class="h-[360px] border-l border-gray-300"></div>
      <div v-if="suggestions.length >= 3 && !isResultsEmpty && currentPage === 1" class="h-[520px] border-l border-gray-300"></div>

      <!-- Suggestions Section -->
      <aside class="w-1/3 pr-20">
        <h2 class="text-lg font-semibold text-gray-800 mb-3" v-if="suggestions.length > 0 && !isResultsEmpty && currentPage === 1">Suggested</h2>
        <ul class="space-y-4" v-if="suggestions.length > 0 && !isResultsEmpty && currentPage === 1">
          <li
              v-for="suggestion in suggestions"
              :key="suggestion.href"
              class="p-4 border rounded-md shadow-sm bg-white"
          >
            <div class="flex justify-between items-center">
              <h3 class="font-bold text-violet-600">
                <a :href="suggestion.href" target="_blank">{{ suggestion.name }}</a>
              </h3>
              <div class="age-salary flex space-x-4 ml-auto text-right mr-2">
                <p class="text-violet-600">Age: {{ suggestion.age }}</p>
                <p class="text-violet-600">Salary: {{ suggestion.salary }} CHF/hr</p>
              </div>
            </div>

            <p class="text-gray-600 mt-2" v-html="suggestion.description"></p>
          </li>
        </ul>
      </aside>
    </main>
</div>

 
    <!-- Pagination -->
    <footer v-if="showPaginator" class="mt-auto flex justify-center mt-6 p-4 pb-8 border-gray-300">
      <Paginator
        :rows="resultsPerPage"
        :totalRecords="this.totalResults"
        :page="currentPage - 1"
        @page="changePage"
        :template="{
          '640px': 'PrevPageLink CurrentPageReport NextPageLink',
          '960px': 'FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink',
          '1300px': 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink',
          default: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink'
        }"
      />
    </footer>
  </div>
</template>

<script>
import axios from "axios";
import Slider from 'primevue/slider';
import Paginator from 'primevue/paginator';

export default {
  name: "SearchResults",
  components: {
    Slider,
    Paginator
  },
  props: {
    searchQuery: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      localSearchQuery: this.searchQuery,
      displayQuery: this.searchQuery,
      oldQuery: this.searchQuery,
      results: [],
      totalResults: 0,
      currentPage: 1,
      resultsPerPage: 10,
      suggestions: [],
      suggQuery: "",
      suggestionParams: [],
      minAge:0, 
      maxAge: 100, 
      minSalary: 0, 
      maxSalary: 100, 
      ageRange: [0,100], 
      salaryRange: [0,100],
      isResultsEmpty: false,
      showFilters: true,
      showPaginator: true,
      isLoading: false,
      shadowClass: '',
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.totalResults / this.resultsPerPage);
    },
    computedMinAge() {
      return this.minAge === this.maxAge ? this.minAge - 1 : this.minAge;
    },
    computedMaxAge() {
      return this.minAge === this.maxAge ? this.maxAge + 1 : this.maxAge;
    },
    computedMinSalary() {
      return this.minSalary === this.maxSalary ? this.minSalary - 1 : this.minSalary;
    },
    computedMaxSalary() {
      return this.minSalary === this.maxSalary ? this.maxSalary + 1 : this.maxSalary;
    },
  },
  watch: {
    localSearchQuery(newValue) {
      this.$emit("update:searchQuery", newValue);
    },
    searchQuery(newValue) {
      this.localSearchQuery = newValue;
    },
  },
  methods: {
    async fetchResults() {
      this.isLoading = true;
      try {
          let ageQuery = JSON.stringify(this.ageRange);
          let salaryQuery = JSON.stringify(this.salaryRange);

          const url = `http://localhost:3000/api/results?query=${this.localSearchQuery}&ageRange=${ageQuery}&salaryRange=${salaryQuery}`;

          const response = await axios.get(url);
          let data = response.data;
          const start=((this.currentPage-1)*10);
          const agg=Math.min(10,data[2]-start)
          data[0]=data[0].slice(start,start+agg);
          this.results = data[0].map((item) => ({
              url: item.url[0],
              href: item.href[0],
              name: item.name[0],
              age: parseInt(item.age[0], 10),
              salary: typeof item.salary[0] === 'string'
              ? parseFloat(item.salary[0].replace(/[^0-9.]/g, ''))
              : item.salary[0],
              description: item.description[0],
              selectedFeedback: null,
          }));

          this.ageRange = data[3];  
          this.salaryRange = data[4]; 

          if (this.minAge === 0 && this.maxAge === 100) {
              this.minAge = this.ageRange[0];
              this.maxAge = this.ageRange[1];
          }

          if (this.minSalary === 0 && this.maxSalary === 100) {
            this.minSalary = this.salaryRange[0];
            this.maxSalary = this.salaryRange[1];
          }

          this.suggestions = data[1].map((item) => ({
            href: item.href[0],
            name: item.name[0],
            age: parseInt(item.age[0], 10),
            salary: typeof item.salary[0] === 'string'
                ? parseFloat(item.salary[0].replace(/[^0-9.]/g, ''))
                : item.salary[0],
            description: item.description[0],
          }));

          this.totalResults = data[2];
          this.isResultsEmpty = this.results.length === 0;
          if (this.isResultsEmpty && this.currentPage === 1) {
            if (this.oldQuery !== this.localSearchQuery) {
                this.oldQuery = this.localSearchQuery;
                this.showFilters = false;
                this.showPaginator = false;
            }
          } else {
              this.showFilters = true;
              this.showPaginator = true;
          }

          this.$router.push({ path: '/results?query='+this.localSearchQuery, query: { query: this.localSearchQuery }});
        
      } catch (error) {
          console.error("Error in data recovery:", error);
      } finally {
          this.isLoading = false;
      }
    },
    async fetchFeedback(description, feedback) {
      try {
        const url = `http://localhost:3000/api/results/feedback?feedback=${feedback}`;
        console.log(description);
        await axios.post(url, { description: description });
      } catch (error) {
        console.error("Error in data recovery:", error);
      }
    },
    handleFeedback(result, feedback) {
      result.selectedFeedback = result.selectedFeedback === feedback ? null : feedback;
      if (result.selectedFeedback) {
        this.fetchFeedback(result.description, feedback);
      }
    },
    performSearch() {
      if((this.localSearchQuery).trim().length>0){
      this.currentPage = 1;
      this.displayQuery = this.localSearchQuery;
      this.minAge = 0;
      this.maxAge = 100;
      this.minSalary = 0;
      this.maxSalary = 100;
      this.ageRange = [0, 100];
      this.salaryRange = [0, 100];
      this.fetchResults();
      this.$refs.searchInput.blur();
      }
    },
    clearSearch() {
      this.localSearchQuery = "";
      this.totalResults = 0;
      this.currentPage = 1;
      this.$nextTick(() => {
        this.$refs.searchInput.focus();
      });
    },
    changePage(event) {
      this.currentPage = event.page + 1;
      this.fetchResults();
    },
    updateFilters() {
      this.validateSliders();
      this.fetchResults();  
    },
    validateSliders() {
      if (this.ageRange[0] > this.ageRange[1]) {
        this.ageRange = [this.ageRange[1], this.ageRange[0]];
      }
      if (this.salaryRange[0] > this.salaryRange[1]) {
        this.salaryRange = [this.salaryRange[1], this.salaryRange[0]];
      }
    },
    handleScroll() {
    if (window.scrollY > 10) {
      this.shadowClass = 'shadow-md'; 
    } else {
      this.shadowClass = ''; 
    }
  },
  },
  mounted() {
    this.fetchResults().then(() => {
        if (this.isResultsEmpty) {
            this.showFilters = false;
            this.showPaginator = false;
        }
    });
    window.addEventListener('scroll', this.handleScroll); 
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll); 
  },
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

:deep(.p-paginator.p-component.p-paginator-default),
:deep(.p-paginator.p-component.p-paginator-1300px){
  background-color: #ffffff!important;
  color:#ffffff !important;
}

:deep(.p-paginator-page.p-paginator-page-selected),
:deep(.p-paginator-page:hover),
:deep(.p-paginator-next:hover),
:deep(.p-paginator-last:hover),
:deep(.p-paginator-prev:hover),
:deep(.p-paginator-first:hover) {
  background-color: #8B5CF6!important;
}

:deep(.p-paginator-page.p-paginator-page-selected),
:deep(.p-paginator-page:hover){
  color:#ffffff;
}

.flex-grow {
  flex: 1;
}
.mt-auto {
  margin-top: auto;
}

</style>