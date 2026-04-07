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
    Heading,
    Heading1,
    Heading2,
    Heading3,
    ChevronDown,
    List,
    ListOrdered,
    Quote,
  } from 'lucide-vue-next'

  const props = defineProps<{
    editor: Editor
  }>()

  // 设置链接
  const setLink = () => {
    const previousUrl = props.editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      props.editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    props.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  // 设置标题
  const handleHeading = (level: string | number) => {
    props.editor
      .chain()
      .focus()
      .toggleHeading({ level: Number(level) as any })
      .run()
  }
</script>

<template>
  <div class="flex p-2 overflow-x-auto min-h-10 items-center justify-center">
    <div class="flex items-center gap-1 mr-2">
      <el-tooltip
        content="撤销"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button
          class="toolbar-btn"
          :disabled="!editor.can().undo()"
          @click="editor.chain().focus().undo().run()"
        >
          <Undo2 :size="18" />
        </button>
      </el-tooltip>
      <el-tooltip
        content="重做"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button
          class="toolbar-btn"
          :disabled="!editor.can().redo()"
          @click="editor.chain().focus().redo().run()"
        >
          <Redo2 :size="18" />
        </button>
      </el-tooltip>
    </div>

    <div class="divider" />

    <div class="flex items-center gap-1 mx-2">
      <el-dropdown trigger="click" @command="handleHeading">
        <button class="toolbar-btn" :class="{ 'is-active': editor.isActive('heading') }">
          <Heading :size="18" />
          <ChevronDown :size="14" class="ml-0.5 opacity-70" />
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              command="1"
              :class="{ 'text-[#00dc82]! bg-gray-100!': editor.isActive('heading', { level: 1 }) }"
            >
              <div class="flex items-center gap-2 py-1"><Heading1 :size="18" /> 标题1</div>
            </el-dropdown-item>
            <el-dropdown-item
              command="2"
              :class="{ 'text-[#00dc82]! bg-gray-100!': editor.isActive('heading', { level: 2 }) }"
            >
              <div class="flex items-center gap-2 py-1"><Heading2 :size="18" /> 标题2</div>
            </el-dropdown-item>
            <el-dropdown-item
              command="3"
              :class="{ 'text-[#00dc82]! bg-gray-100!': editor.isActive('heading', { level: 3 }) }"
            >
              <div class="flex items-center gap-2 py-1"><Heading3 :size="18" /> 标题3</div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-tooltip
        content="无序列表"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('bulletList') }"
          @click="editor.chain().focus().toggleBulletList().run()"
        >
          <List :size="18" />
        </button>
      </el-tooltip>
      <el-tooltip
        content="有序列表"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('orderedList') }"
          @click="editor.chain().focus().toggleOrderedList().run()"
        >
          <ListOrdered :size="18" />
        </button>
      </el-tooltip>
      <el-tooltip
        content="引用"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('blockquote') }"
          @click="editor.chain().focus().toggleBlockquote().run()"
        >
          <Quote :size="18" />
        </button>
      </el-tooltip>
    </div>

    <div class="divider" />

    <div class="flex items-center gap-1 mx-2">
      <el-tooltip
        content="加粗"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('bold') }"
          @click="editor.chain().focus().toggleBold().run()"
        >
          <Bold :size="18" />
        </button>
      </el-tooltip>
      <el-tooltip
        content="斜体"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('italic') }"
          @click="editor.chain().focus().toggleItalic().run()"
        >
          <Italic :size="18" />
        </button>
      </el-tooltip>
      <el-tooltip
        content="删除线"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('strike') }"
          @click="editor.chain().focus().toggleStrike().run()"
        >
          <Strikethrough :size="18" />
        </button>
      </el-tooltip>
      <el-tooltip
        content="下划线"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('underline') }"
          @click="editor.chain().focus().toggleUnderline().run()"
        >
          <Underline :size="18" />
        </button>
      </el-tooltip>
      <el-tooltip
        content="代码块"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('code') }"
          @click="editor.chain().focus().toggleCode().run()"
        >
          <Code :size="18" />
        </button>
      </el-tooltip>
      <el-tooltip
        content="高亮"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('highlight') }"
          @click="editor.chain().focus().toggleHighlight().run()"
        >
          <Highlighter :size="18" />
        </button>
      </el-tooltip>
      <el-tooltip
        content="链接"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('link') }"
          @click="setLink"
        >
          <LinkIcon :size="18" />
        </button>
      </el-tooltip>
    </div>

    <div class="divider" />

    <div class="flex items-center gap-1 mx-2">
      <el-tooltip
        content="上标"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('superscript') }"
          @click="editor.chain().focus().toggleSuperscript().run()"
        >
          <Superscript :size="18" />
        </button>
      </el-tooltip>
      <el-tooltip
        content="下标"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('subscript') }"
          @click="editor.chain().focus().toggleSubscript().run()"
        >
          <Subscript :size="18" />
        </button>
      </el-tooltip>
    </div>

    <div class="divider" />

    <div class="flex items-center gap-1 mx-2">
      <el-tooltip
        content="左对齐"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
          @click="editor.chain().focus().setTextAlign('left').run()"
        >
          <AlignLeft :size="18" />
        </button>
      </el-tooltip>
      <el-tooltip
        content="居中对齐"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
          @click="editor.chain().focus().setTextAlign('center').run()"
        >
          <AlignCenter :size="18" />
        </button>
      </el-tooltip>
      <el-tooltip
        content="右对齐"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
          @click="editor.chain().focus().setTextAlign('right').run()"
        >
          <AlignRight :size="18" />
        </button>
      </el-tooltip>
      <el-tooltip
        content="两端对齐"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }"
          @click="editor.chain().focus().setTextAlign('justify').run()"
        >
          <AlignJustify :size="18" />
        </button>
      </el-tooltip>
    </div>
  </div>
</template>

<style scoped>
  @reference "tailwindcss";

  @layer components {
    .toolbar-btn {
      @apply p-1.5 rounded-md text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center min-w-8 h-8;
    }

    .toolbar-btn.is-active {
      @apply bg-gray-100 text-[#00dc82];
    }

    .toolbar-btn:disabled {
      @apply opacity-30 cursor-not-allowed hover:bg-transparent;
    }

    .divider {
      @apply w-px h-5 bg-gray-200;
    }
  }
</style>
