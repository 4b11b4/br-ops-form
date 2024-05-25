<script setup>
import HelloWorld from './components/HelloWorld.vue';
import Who from './components/Who.vue';
</script>

<template>
  <div id="app">
    <a href="http:boldreuse.com/" target="_blank">
      <img src="./assets/br.png" class="" alt="BR" />
    </a>
  </div>
  <router-link class="rl" to="/">Home</router-link> |
  <router-link class="rl" to="/about">About</router-link> |
  <router-link class="rl" to="/login">Login</router-link>
  <router-view></router-view>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
