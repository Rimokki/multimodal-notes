<template>
  <div>
    <EditorContent :editor="previewEditor" class="note-rich-content" />
  </div>
</template>

<script setup>
  import { watch } from 'vue'
  import { useEditor, EditorContent } from '@tiptap/vue-3'
  import StarterKit from '@tiptap/starter-kit'
  import Link from '@tiptap/extension-link'
  import Image from '@tiptap/extension-image'
  import TextAlign from '@tiptap/extension-text-align'
  import Superscript from '@tiptap/extension-superscript'
  import Subscript from '@tiptap/extension-subscript'
  import Highlight from '@tiptap/extension-highlight'
  import Heading from '@tiptap/extension-heading'
  import Audio from '@tiptap/extension-audio'
  import { TaskItem, TaskList } from '@tiptap/extension-list'
  import { DetailsContent, DetailsSummary } from '@tiptap/extension-details'
  import { TextStyleKit } from '@tiptap/extension-text-style'
  import { Details } from '~/extensions/details'
  import { FileCard } from '~/extensions/file-card'

  const props = defineProps({
    content: {
      type: String,
      default: '',
    },
  })

  const previewEditor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        link: false,
      }),
      Image,
      FileCard,
      Superscript,
      Subscript,
      Highlight.configure({
        multicolor: true,
      }),
      Audio,
      TaskList,
      TextStyleKit.configure({
        fontFamily: false,
        lineHeight: {
          types: ['textStyle', 'heading', 'paragraph'],
        },
      }),
      TaskItem.configure({
        nested: true,
      }),
      Details.configure({
        persist: true,
        HTMLAttributes: {
          class: 'details',
        },
      }),
      DetailsSummary,
      DetailsContent,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Link,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    editable: false,
    content: props.content,
    immediatelyRender: false,
  })

  watch(
    () => props.content,
    (newVal) => {
      previewEditor.value?.commands.setContent(newVal)
    },
    { deep: true },
  )
</script>
