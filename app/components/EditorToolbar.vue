<script lang="ts" setup>
  import type { Editor } from '@tiptap/vue-3'
  import {
    Undo2,
    Redo2,
    Bold,
    Italic,
    Strikethrough,
    Code,
    Underline,
    Highlighter,
    Link as LinkIcon,
    Superscript,
    Subscript,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    // Image as ImageIcon,
    Heading1,
    Heading2,
    List,
    ListOrdered,
    Quote,
  } from 'lucide-vue-next'

  const props = defineProps<{
    editor: Editor
  }>()

  // 添加图片的逻辑（暂时用简单的 URL 输入演示，后期可改为弹窗上传）
  // const addImage = () => {
  //   const url = window.prompt('请输入图片 URL')
  //   if (url) {
  //     props.editor.chain().focus().setImage({ src: url }).run()
  //   }
  // }

  // 设置链接
  const setLink = () => {
    const previousUrl = props.editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty
    if (url === '') {
      props.editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // update link
    props.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }
</script>

<template>
  <div class="flex p-2 overflow-x-auto h-8 items-center justify-center">
    <!-- 1. 撤销重做组 -->
    <div class="flex items-center gap-1 mr-2">
      <button
        class="toolbar-btn"
        :disabled="!editor.can().undo()"
        @click="editor.chain().focus().undo().run()"
      >
        <Undo2 :size="18" />
      </button>
      <button
        class="toolbar-btn"
        :disabled="!editor.can().redo()"
        @click="editor.chain().focus().redo().run()"
      >
        <Redo2 :size="18" />
      </button>
    </div>

    <div class="divider" />

    <!-- 2. 标题与列表组 -->
    <div class="flex items-center gap-1 mx-2">
      <button
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
        title="标题 1"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
      >
        <Heading1 :size="18" />
      </button>
      <button
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
        title="标题 2"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        <Heading2 :size="18" />
      </button>
      <button
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive('bulletList') }"
        @click="editor.chain().focus().toggleBulletList().run()"
      >
        <List :size="18" />
      </button>
      <button
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive('orderedList') }"
        @click="editor.chain().focus().toggleOrderedList().run()"
      >
        <ListOrdered :size="18" />
      </button>
      <button
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive('blockquote') }"
        @click="editor.chain().focus().toggleBlockquote().run()"
      >
        <Quote :size="18" />
      </button>
    </div>

    <div class="divider" />

    <!-- 3. 基础格式组 -->
    <div class="flex items-center gap-1 mx-2">
      <button
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive('bold') }"
        @click="editor.chain().focus().toggleBold().run()"
      >
        <Bold :size="18" />
      </button>
      <button
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive('italic') }"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        <Italic :size="18" />
      </button>
      <button
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive('strike') }"
        @click="editor.chain().focus().toggleStrike().run()"
      >
        <Strikethrough :size="18" />
      </button>
      <button
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive('underline') }"
        @click="editor.chain().focus().toggleUnderline().run()"
      >
        <Underline :size="18" />
      </button>
      <button
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive('code') }"
        @click="editor.chain().focus().toggleCode().run()"
      >
        <Code :size="18" />
      </button>
      <button
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive('highlight') }"
        @click="editor.chain().focus().toggleHighlight().run()"
      >
        <Highlighter :size="18" />
      </button>
      <button
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive('link') }"
        @click="setLink"
      >
        <LinkIcon :size="18" />
      </button>
    </div>

    <div class="divider" />

    <!-- 4. 角标组 -->
    <div class="flex items-center gap-1 mx-2">
      <button
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive('superscript') }"
        @click="editor.chain().focus().toggleSuperscript().run()"
      >
        <Superscript :size="18" />
      </button>
      <button
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive('subscript') }"
        @click="editor.chain().focus().toggleSubscript().run()"
      >
        <Subscript :size="18" />
      </button>
    </div>

    <div class="divider" />

    <!-- 5. 对齐组 -->
    <div class="flex items-center gap-1 mx-2">
      <button
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
        @click="editor.chain().focus().setTextAlign('left').run()"
      >
        <AlignLeft :size="18" />
      </button>
      <button
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
        @click="editor.chain().focus().setTextAlign('center').run()"
      >
        <AlignCenter :size="18" />
      </button>
      <button
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
        @click="editor.chain().focus().setTextAlign('right').run()"
      >
        <AlignRight :size="18" />
      </button>
      <button
        class="toolbar-btn"
        :class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }"
        @click="editor.chain().focus().setTextAlign('justify').run()"
      >
        <AlignJustify :size="18" />
      </button>
    </div>

    <div class="divider" />
  </div>
</template>

<style lang="postcss" scoped>
  .toolbar-btn {
    @apply p-1.5 rounded-md text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center min-w-[32px] h-[32px];
  }

  .toolbar-btn.is-active {
    @apply bg-blue-100 text-blue-600;
  }

  .toolbar-btn:disabled {
    @apply opacity-30 cursor-not-allowed hover:bg-transparent;
  }

  .divider {
    @apply w-px h-5 bg-gray-200;
  }
</style>
