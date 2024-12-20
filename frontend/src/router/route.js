import { createRouter, createWebHistory } from 'vue-router';
import SearchBar from '../components/SearchBar.vue'; 
import SearchResults from '../components/SearchResults.vue'; 


const routes = [
  {
    path: '/', 
    name: 'SearchBar',
    component: SearchBar,
  },
  {
    path: '/results', 
    name: 'SearchResults',
    component: SearchResults,
    props: route => ({ searchQuery: route.query.query }),
  },
];

const router = createRouter({
  history: createWebHistory(), 
  routes,
});

export default router;
