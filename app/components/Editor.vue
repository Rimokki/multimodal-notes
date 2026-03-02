<template>
  <EditorContent :editor="editor" />
</template>

<script setup>
  import { useEditor, EditorContent } from '@tiptap/vue-3'
  import StarterKit from '@tiptap/starter-kit'

  const text = defineModel({
    type: String,
    default: '',
  })

  const editor = useEditor({
    content: text.value,
    extensions: [StarterKit],
    // Don't render on the server, only on the client after hydration
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // HTML
      text.value = editor.getHTML()

      // JSON
      // text.value = editor.getJSON()
    },
  })

  watch(
    () => text.value,
    (value) => {
      // HTML
      const isSame = editor.value?.getHTML() === value

      // JSON
      // const isSame = JSON.stringify(editor.value?.getJSON()) === JSON.stringify(value)

      if (isSame) {
        return
      }

      editor.value?.commands.setContent(value, false)
    },
  )
</script>
