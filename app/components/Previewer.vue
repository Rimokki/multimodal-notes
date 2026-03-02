<template>
  <div>
    <EditorContent :editor="previewEditor" />
  </div>
</template>

<script setup>
  import { watch } from 'vue'
  import { useEditor, EditorContent } from '@tiptap/vue-3'
  import StarterKit from '@tiptap/starter-kit'

  const props = defineProps({
    content: {
      type: String,
      default: '',
    },
  })

  const previewEditor = useEditor({
    extensions: [StarterKit],
    editable: false,
    content: props.content,
  })

  watch(
    () => props.content,
    (newVal) => {
      previewEditor.value?.commands.setContent(newVal)
    },
    { deep: true },
  )
</script>
