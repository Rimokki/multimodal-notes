<template>
  <div>
    <ClientOnly>
      <Teleport to="#toolbar-target">
        <EditorToolbar v-if="editor" :editor="editor" />
      </Teleport>
    </ClientOnly>

    <EditorContent :editor="editor" class="note-rich-content" />

    <ClientOnly>
      <Teleport to="#editor-character-count">
        <span v-if="editor" class="text-gray-400 text-xs z-10">
          {{ editor.storage.characterCount.characters() }}字
        </span>
      </Teleport>
    </ClientOnly>
  </div>
</template>

<script setup>
  import { useEditor, EditorContent } from '@tiptap/vue-3'
  import { CharacterCount, Placeholder } from '@tiptap/extensions'
  import StarterKit from '@tiptap/starter-kit'
  import Link from '@tiptap/extension-link'
  import Image from '@tiptap/extension-image'
  import TextAlign from '@tiptap/extension-text-align'
  import Superscript from '@tiptap/extension-superscript'
  import Subscript from '@tiptap/extension-subscript'
  import Highlight from '@tiptap/extension-highlight'
  import Heading from '@tiptap/extension-heading'

  const text = defineModel({
    type: String,
    default: '',
  })

  const editor = useEditor({
    content: text.value,
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      CharacterCount,
      Image,
      Superscript,
      Subscript,
      Highlight,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Placeholder.configure({
        placeholder: '请输入内容',
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    // Don't render on the server, only on the client after hydration
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // HTML
      text.value = editor.getHTML()

      // JSON
      // text.value = editor.getJSON()
    },
  })

  const focus = () => {
    editor.value?.commands.focus()
  }

  defineExpose({
    focus,
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

<style lang="postcss" scoped>
  :deep(.is-editor-empty:first-child::before) {
    color: #adb5bd;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
</style>
