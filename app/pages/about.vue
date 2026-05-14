<script lang="ts" setup>
  const content = ``
</script>

<template>
  <div class="max-w-5xl mx-auto px-3">
    <h1 class="font-bold text-2xl mt-2! mb-4!">快速指南</h1>
    <div class="about-preview">
      <ClientOnly>
        <Previewer :content="content" />
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
  .about-preview :deep(.note-rich-content .ProseMirror) {
    padding: 0;
  }
</style>
