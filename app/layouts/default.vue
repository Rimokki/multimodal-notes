<script setup lang="ts">
  import Sidebar from '~/components/Sidebar.vue'
</script>

<template>
  <div class="layout-container">
    <Sidebar />
    <main class="content-area">
      <slot />
    </main>
  </div>
</template>

<style lang="css" scoped>
  .layout-container {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  .content-area {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    scrollbar-gutter: stable;
  }
</style>
