<script lang="ts" setup>
  definePageMeta({
    layout: 'editor',
  })

  const isEditing = useState('isEditing')
  const content = ref('')
</script>

<template>
  <div>
    <div v-show="isEditing">
      <Editor v-model="content" />
    </div>

    <div v-show="!isEditing">
      <Previewer :content="content" />
    </div>
  </div>
</template>

<style lang="postcss" scoped></style>
