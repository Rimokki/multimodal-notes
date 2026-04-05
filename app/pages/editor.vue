<script lang="ts" setup>
  definePageMeta({
    layout: 'editor',
  })

  const isEditing = useState('isEditing')

  const title = useState('noteTitle', () => '')
  const content = ref('')
  const editorRef = ref()

  const onTitleEnter = () => {
    editorRef.value?.focus()
  }
</script>

<template>
  <div class="w-3xl mx-auto -translate-x-24">
    <div class="mb-4!">
      <el-input
        v-if="isEditing"
        v-model="title"
        placeholder="请输入标题"
        class="note-title-input text-4xl font-bold border-none shadow-none resize-none bg-transparent"
        resize="none"
        type="textarea"
        maxlength="40"
        autosize
        @keydown.enter.prevent="onTitleEnter"
      />

      <h1
        v-else
        class="text-4xl font-bold text-gray-900 leading-tight wrap-break-word whitespace-pre-wrap"
      >
        {{ title || '无标题笔记' }}
      </h1>
    </div>

    <div v-show="isEditing">
      <Editor ref="editorRef" v-model="content" />
    </div>

    <div v-show="!isEditing">
      <Previewer :content="content" />
    </div>
  </div>
</template>

<style lang="postcss" scoped>
  :deep(.note-title-input .el-textarea__inner) {
    padding: 0 !important;
    box-shadow: none !important;
    font-size: 36px !important;
    min-height: 40px !important;
  }

  :deep(.note-title-input .el-textarea__inner::placeholder) {
    @apply text-gray-300;
  }
</style>
