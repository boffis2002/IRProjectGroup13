import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config';
import router from './router/route';
import Aura from '@primevue/themes/aura';
     
import 'primeicons/primeicons.css';
import 'tailwindcss/tailwind.css'
import './assets/tailwind.css'



let vue_app = createApp(App);

export const app = vue_app
    .use(PrimeVue, {
        theme: {
            preset: Aura,
            options: {
                prefix: 'p',
                darkModeSelector: 'system',
                cssLayer: false
            }
        }
    })
    .use(router)
    .mount("#app");


    

    
    