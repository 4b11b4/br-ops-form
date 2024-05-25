// src/router.js
import { createRouter, createWebHistory } from 'vue-router';
import Home from './pages/Home.vue';
import About from './pages/About.vue';
import Login from './pages/Login.vue';
import Operations from './pages/Operations.vue';

const routes = [
  { path: '/', component: Home, name: 'Home' },
  { path: '/about', component: About, name: 'About' },
  { path: '/login', component: Login, name: 'Login' },
  { path: '/operations', component: Operations, name: 'Operations' },
  // { path: '/operations/:id', component: Operations, name: 'Operations' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
