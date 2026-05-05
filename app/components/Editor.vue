<template>
  <div class="relative">
    <ClientOnly>
      <Teleport to="#toolbar-target">
        <EditorToolbar v-if="editor" :editor="editor" />
      </Teleport>

      <DragHandle
        v-if="editor"
        :editor="editor"
        :compute-position-config="{ placement: 'left-start', strategy: 'absolute' }"
        class="flex items-center justify-center text-gray-400 bg-gray-200/50 hover:bg-gray-400/50 rounded-md w-4 h-5 cursor-grab transition-colors -translate-x-0.75"
      >
        <GripVertical :size="16" />
      </DragHandle>

      <EditorContent :editor="editor" class="note-rich-content" />
      <TableBubbleMenu v-if="editor" :editor="editor" />
      <CanvasBubbleMenu v-if="editor" :editor="editor" />
      <!-- <TableInsertHandles v-if="editor" :editor="editor" /> -->

      <Teleport to="#editor-character-count">
        <span v-if="editor" class="text-gray-400 text-xs z-10">
          {{ editor.storage.characterCount.characters() }}字
        </span>
      </Teleport>

      <Teleport to="#toc-target">
        <ToC v-if="editor" :editor="editor" :items="tocItems" />
      </Teleport>
    </ClientOnly>
  </div>
</template>

<script setup>
  import { GripVertical } from 'lucide-vue-next'
  import { DragHandle } from '@tiptap/extension-drag-handle-vue-3'
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
  import Audio from '@tiptap/extension-audio'
  import { getHierarchicalIndexes, TableOfContents } from '@tiptap/extension-table-of-contents'
  import { DetailsContent, DetailsSummary } from '@tiptap/extension-details'
  import { TaskItem, TaskList } from '@tiptap/extension-list'
  import { TextStyleKit } from '@tiptap/extension-text-style'
  import { TableKit } from '@tiptap/extension-table'
  import { Markdown } from '@tiptap/markdown'
  import { Details } from '~/extensions/details'
  import { FileCard } from '~/extensions/file-card'
  import Canvas from '~/extensions/canvas'

  const SuperscriptMd = Superscript.extend({
    renderMarkdown: (_node, h) => `^(${h.renderChildren(_node)})`,
    parseMarkdown: (token, h) => {
      return h.applyMark('superscript', h.parseInline(token.tokens || []))
    },
    markdownTokenizer: {
      name: 'superscript',
      level: 'inline',
      start: (src) => src.indexOf('^('),
      tokenize(src, _tokens, h) {
        const rule = /^\^\(([^)]+)\)/
        const match = rule.exec(src)
        if (match) {
          return {
            type: 'superscript',
            raw: match[0],
            tokens: h.inlineTokens(match[1]),
          }
        }
      },
    },
  })

  const SubscriptMd = Subscript.extend({
    renderMarkdown: (_node, h) => `~(${h.renderChildren(_node)})`,
    parseMarkdown: (token, h) => {
      return h.applyMark('subscript', h.parseInline(token.tokens || []))
    },
    markdownTokenizer: {
      name: 'subscript',
      level: 'inline',
      start: (src) => src.indexOf('~('),
      tokenize(src, _tokens, h) {
        const rule = /^~\(([^)]+)\)/
        const match = rule.exec(src)
        if (match) {
          return {
            type: 'subscript',
            raw: match[0],
            tokens: h.inlineTokens(match[1]),
          }
        }
      },
    },
  })

  const AudioMd = Audio.extend({
    renderMarkdown: (node) => {
      const src = node.attrs?.src || ''
      return src ? `<audio src="${src}"></audio>` : ''
    },
    parseMarkdown: (token, h) => {
      return h.createNode('audio', { src: token.src || '' })
    },
    markdownTokenizer: {
      name: 'audio',
      level: 'block',
      start: (src) => src.match(/<audio/)?.index ?? -1,
      tokenize(src, _tokens, _h) {
        const rule = /^<audio\s+src="([^"]+)"><\/audio>/
        const match = rule.exec(src)
        if (match) {
          return {
            type: 'audio',
            raw: match[0],
            src: match[1],
          }
        }
      },
    },
  })

  const text = defineModel({
    type: String,
    default: '',
  })

  const tocItems = ref([])

  const editor = useEditor({
    content: text.value,
    extensions: [
      StarterKit.configure({
        heading: false,
        link: false,
      }),
      CharacterCount,
      Image,
      SuperscriptMd,
      SubscriptMd,
      Highlight.configure({
        multicolor: true,
      }),
      AudioMd,
      FileCard,
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
      Placeholder.configure({
        placeholder: '请输入内容',
      }),
      Link,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TableOfContents.configure({
        getIndex: getHierarchicalIndexes,
        scrollParent: () => {
          return document.getElementById('editor-scroll-container') || window
        },
        onUpdate: (anchors) => {
          tocItems.value = anchors
        },
      }),
      TableKit.configure({
        table: { resizable: true },
      }),
      Markdown.configure({
        indentation: { style: 'space', size: 2 },
      }),
      Canvas,
    ],
    // Don't render on the server, only on the client after hydration
    immediatelyRender: false,

    onUpdate: ({ editor }) => {
      nextTick(() => {
        // HTML
        text.value = editor.getHTML()

        // JSON
        // text.value = editor.getJSON()
      })
    },
  })

  const focus = () => {
    editor.value?.commands.focus()
  }

  defineExpose({
    focus,
  })

  const { setEditor } = useExport()
  watch(
    editor,
    (e) => {
      if (e) setEditor(e)
    },
    { immediate: true },
  )

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

      editor.value?.commands.setContent(value, { emitUpdate: false, addToHistory: false })
    },
  )
</script>

<style lang="postcss" scoped>
  :deep(.is-editor-empty:first-child:last-child::before) {
    color: #adb5bd;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
</style>
