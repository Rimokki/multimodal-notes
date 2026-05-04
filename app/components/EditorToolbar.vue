<script lang="ts" setup>
  import type { Editor } from '@tiptap/vue-3'
  import { computed, onBeforeUnmount, ref } from 'vue'
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
    Grid2X2Plus,
    ImagePlus,
    AudioLines,
    FilePlusCorner,
    ScanText,
    ImageUp,
    Minus,
    ListCollapse,
    SquareCheck,
    ListChevronsUpDown,
    Baseline,
    CornerDownLeft,
    ExternalLink,
    Trash2,
    Ban,
    Table,
  } from 'lucide-vue-next'
  import { createWorker } from 'tesseract.js'
  import ColorPickerPanel from '~/components/ColorPickerPanel.vue'

  const props = defineProps<{
    editor: Editor
  }>()

  type InsertAssetKind = 'IMAGE' | 'AUDIO' | 'FILE'

  const noteId = useState<number | null>('activeNoteId')
  const { uploadNoteAsset } = useNotesApi()
  const imageInputRef = ref<HTMLInputElement | null>(null)
  const audioInputRef = ref<HTMLInputElement | null>(null)
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const ocrImageInputRef = ref<HTMLInputElement | null>(null)
  const linkInputRef = ref<HTMLInputElement | null>(null)
  const assetUploading = ref(false)
  const ocrDrawerVisible = ref(false)
  const ocrResult = ref('')
  const ocrImagePreviewUrl = ref('')
  const ocrRecognizing = ref(false)
  const fontColorPopoverVisible = ref(false)
  const isTableDialogVisible = ref(false)
  const linkPopoverVisible = ref(false)
  const tableSize = ref({ rows: 3, cols: 3 })
  const linkInput = ref('')
  const linkSelectionRange = ref<{ from: number; to: number } | null>(null)
  const linkPlaceholderActive = ref(false)
  const fontSizeOptions = [12, 13, 14, 15, 16, 20, 24, 28, 32, 40, 48]
  const lineHeightOptions = [
    { label: '默认', value: 'default' },
    { label: '1.5', value: 1.5 },
    { label: '1.75', value: 1.75 },
    { label: '2', value: 2 },
    { label: '2.5', value: 2.5 },
    { label: '3', value: 3 },
  ]
  const highlightColors = ['#dcfce7', '#e0f2fe', '#ffe4e6', '#f3e8ff', '#fef9c3']

  const openTableDialog = () => {
    isTableDialogVisible.value = true
  }

  const handleInsertTable = () => {
    props.editor
      .chain()
      .focus()
      .insertTable({
        rows: tableSize.value.rows,
        cols: tableSize.value.cols,
        withHeaderRow: true,
      })
      .run()
    isTableDialogVisible.value = false
  }

  const revokeOcrPreviewUrl = () => {
    if (ocrImagePreviewUrl.value) {
      URL.revokeObjectURL(ocrImagePreviewUrl.value)
      ocrImagePreviewUrl.value = ''
    }
  }

  const triggerOcrImageUpload = () => {
    ocrImageInputRef.value?.click()
  }

  const handleOcrImageChange = (event: Event) => {
    const target = event.target as HTMLInputElement | null
    const file = target?.files?.[0]

    if (target) {
      target.value = ''
    }

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      ElMessage.warning('请选择图片文件')
      return
    }

    revokeOcrPreviewUrl()
    ocrImagePreviewUrl.value = URL.createObjectURL(file)
    runOcrByImage(file)
  }

  onBeforeUnmount(() => {
    revokeOcrPreviewUrl()
  })

  const openOcrDrawer = () => {
    ocrDrawerVisible.value = true
  }

  const closeOcrDrawer = () => {
    ocrDrawerVisible.value = false
  }

  const handleOcrInsert = () => {
    if (!ocrResult.value.trim()) {
      ElMessage.warning('暂无可插入的识别文本')
      return
    }

    props.editor.chain().focus().insertContent(ocrResult.value).run()
    ocrDrawerVisible.value = false
    ElMessage.success('识别文本已插入')
  }

  const runOcrByImage = async (imageSource: string | File) => {
    const worker = await createWorker(['eng', 'chi_sim'])

    try {
      ocrRecognizing.value = true
      const { data } = await worker.recognize(imageSource)
      ocrResult.value = data.text.trim()
    } catch {
      ocrResult.value = ''
      ElMessage.error('文字提取失败，请重试')
    } finally {
      ocrRecognizing.value = false
      await worker.terminate()
    }
  }

  const matchExpectedKind = (mimeType: string, expectedKind: InsertAssetKind) => {
    if (expectedKind === 'IMAGE') {
      return mimeType.startsWith('image/')
    }
    if (expectedKind === 'AUDIO') {
      return mimeType.startsWith('audio/')
    }
    return (
      mimeType === 'application/pdf' ||
      mimeType === 'text/plain' ||
      mimeType === 'text/markdown' ||
      mimeType === 'text/csv' ||
      mimeType === 'application/json'
    )
  }

  const insertAssetByKind = (kind: InsertAssetKind, url: string, name: string) => {
    if (kind === 'IMAGE') {
      props.editor.chain().focus().setImage({ src: url, alt: name, title: name }).run()
      return
    }

    if (kind === 'AUDIO') {
      props.editor.chain().focus().setAudio({ src: url }).run()
      return
    }

    props.editor
      .chain()
      .focus()
      .insertContent([
        {
          type: 'fileCard',
          attrs: {
            href: `${url}?kind=FILE`,
            title: name,
          },
        },
        {
          type: 'paragraph',
        },
      ])
      .run()
  }

  const getCurrentLink = () => {
    return (props.editor.getAttributes('link').href || '').trim()
  }

  const restoreLinkSelection = () => {
    if (!linkSelectionRange.value) {
      return
    }

    const { from, to } = linkSelectionRange.value
    props.editor.chain().focus().setTextSelection({ from, to }).run()
  }

  const prepareLinkPlaceholder = () => {
    const { from, to } = props.editor.state.selection

    if (from === to) {
      linkSelectionRange.value = null
      linkPlaceholderActive.value = false
      return
    }

    linkSelectionRange.value = { from, to }
    props.editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .extendMarkRange('link')
      .setLink({ href: '' })
      .run()
    linkPlaceholderActive.value = true
  }

  const syncLinkInput = () => {
    linkInput.value = getCurrentLink()

    nextTick(() => {
      if (linkInputRef.value) {
        linkInputRef.value.focus()
      }
    })
  }

  const normalizeLinkUrl = (rawUrl: string) => {
    const value = rawUrl.trim()
    if (!value) {
      return ''
    }

    const hasProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)
    if (hasProtocol) {
      return value
    }

    return `https://${value}`
  }

  const applyLink = () => {
    const url = normalizeLinkUrl(linkInput.value)

    if (!url) {
      ElMessage.warning('请输入链接地址')
      return
    }

    restoreLinkSelection()
    props.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    linkInput.value = url
    linkPlaceholderActive.value = false
    linkSelectionRange.value = null
    linkPopoverVisible.value = false
  }

  const openLink = () => {
    const target = normalizeLinkUrl(linkInput.value || getCurrentLink())

    if (!target) {
      ElMessage.warning('暂无可打开的链接')
      return
    }

    window.open(target, '_blank', 'noopener,noreferrer')
  }

  const removeLink = () => {
    restoreLinkSelection()
    props.editor.chain().focus().extendMarkRange('link').unsetLink().run()
    linkInput.value = ''
    linkPlaceholderActive.value = false
    linkSelectionRange.value = null
    linkPopoverVisible.value = false
  }

  const handleLinkPopoverHide = () => {
    if (linkPlaceholderActive.value) {
      restoreLinkSelection()

      if (!getCurrentLink()) {
        props.editor.chain().focus().extendMarkRange('link').unsetLink().run()
      }
    }

    linkPlaceholderActive.value = false
    linkSelectionRange.value = null
  }

  // 设置标题
  const handleHeading = (level: string | number) => {
    props.editor
      .chain()
      .focus()
      .toggleHeading({ level: Number(level) as any })
      .run()
  }

  const handleFontSize = (size: string | number) => {
    props.editor
      .chain()
      .focus()
      .setFontSize(`${Number(size)}px`)
      .run()
  }

  const getCurrentFontSizeLabel = () => {
    return props.editor.getAttributes('textStyle').fontSize || '16px'
  }

  const currentFontColor = computed(() => {
    return props.editor.getAttributes('textStyle').color || '#000000'
  })

  const handleFontColorChange = (color: string) => {
    if (!color) {
      props.editor.chain().focus().setColor('#000000').run()
      return
    }

    props.editor.chain().focus().setColor(color).run()
  }

  const selectedFontColor = computed({
    get: () => currentFontColor.value,
    set: (color: string) => {
      handleFontColorChange(color)
    },
  })

  const isFontSizeActive = (size: number) => {
    const currentFontSize = props.editor.getAttributes('textStyle').fontSize
    if (!currentFontSize) {
      return size === 16
    }
    return currentFontSize === `${size}px`
  }

  const handleLineHeight = (lineHeight: string | number) => {
    const normalizedLineHeight =
      lineHeight === 'default' ? null : String(Math.max(Number(lineHeight), 1.5))
    const targetLineHeight = normalizedLineHeight

    if (props.editor.isActive('heading')) {
      props.editor
        .chain()
        .focus()
        .updateAttributes('heading', { lineHeight: targetLineHeight })
        .run()
      return
    }

    if (props.editor.isActive('paragraph')) {
      props.editor
        .chain()
        .focus()
        .updateAttributes('paragraph', { lineHeight: targetLineHeight })
        .run()
      return
    }

    if (targetLineHeight === null) {
      props.editor.chain().focus().unsetLineHeight().run()
      return
    }

    props.editor.chain().focus().setLineHeight(targetLineHeight).run()
  }

  const getActiveLineHeight = () => {
    if (props.editor.isActive('heading')) {
      return props.editor.getAttributes('heading').lineHeight
    }

    if (props.editor.isActive('paragraph')) {
      return props.editor.getAttributes('paragraph').lineHeight
    }

    return props.editor.getAttributes('textStyle').lineHeight
  }

  const isLineHeightActive = (lineHeight: string | number) => {
    const currentLineHeight = getActiveLineHeight()
    if (!currentLineHeight) {
      return lineHeight === 'default'
    }
    return String(currentLineHeight) === String(lineHeight)
  }

  const handleInsertContents = (command: string) => {
    if (command === '1') {
      imageInputRef.value?.click()
    } else if (command === '2') {
      audioInputRef.value?.click()
    } else if (command === '3') {
      fileInputRef.value?.click()
    } else if (command === '4') {
      openTableDialog()
    } else {
      return
    }
  }

  const handleAssetFileChange = async (expectedKind: InsertAssetKind, event: Event) => {
    const target = event.target as HTMLInputElement | null
    const file = target?.files?.[0]

    if (target) {
      target.value = ''
    }

    if (!file) {
      return
    }

    if (!noteId.value) {
      ElMessage.warning('笔记尚未初始化，暂时无法上传资源')
      return
    }

    if (!matchExpectedKind(file.type, expectedKind)) {
      ElMessage.warning('文件类型与当前插入项不匹配')
      return
    }

    try {
      assetUploading.value = true
      const { asset } = await uploadNoteAsset(noteId.value, file)
      insertAssetByKind(asset.kind as InsertAssetKind, asset.url, file.name)
      ElMessage.success('插入成功')
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '上传失败')
    } finally {
      assetUploading.value = false
    }
  }
</script>

<template>
  <div class="flex p-2 overflow-x-auto min-h-10 items-center justify-center">
    <input
      ref="imageInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="(event) => handleAssetFileChange('IMAGE', event)"
    />
    <input
      ref="audioInputRef"
      type="file"
      accept="audio/*"
      class="hidden"
      @change="(event) => handleAssetFileChange('AUDIO', event)"
    />
    <input
      ref="fileInputRef"
      type="file"
      accept=".pdf,.txt,.md,.csv,.json,application/pdf,text/plain,text/markdown,text/csv,application/json"
      class="hidden"
      @change="(event) => handleAssetFileChange('FILE', event)"
    />
    <input
      ref="ocrImageInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleOcrImageChange"
    />

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
        content="任务列表"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button
          class="toolbar-btn"
          :class="{ 'is-active': editor.isActive('taskList') }"
          @click="editor.chain().focus().toggleTaskList().run()"
        >
          <SquareCheck :size="18" />
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
      <el-tooltip
        content="折叠块"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button class="toolbar-btn" @click="editor.chain().focus().setDetails().run()">
          <ListCollapse :size="18" />
        </button>
      </el-tooltip>
    </div>

    <div class="divider" />

    <div class="flex items-center gap-1 mx-2">
      <el-dropdown trigger="click" @command="handleFontSize">
        <button class="toolbar-btn min-w-16 justify-between px-2">
          <span class="text-sm font-semibold leading-none">{{ getCurrentFontSizeLabel() }}</span>
          <ChevronDown :size="14" class="ml-0.5 opacity-70" />
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="size in fontSizeOptions"
              :key="size"
              :command="String(size)"
              :class="{ 'text-[#00dc82]! bg-gray-100!': isFontSizeActive(size) }"
            >
              <div class="flex items-center justify-center gap-2 py-1 min-w-12">{{ size }}px</div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-popover
        v-model:visible="fontColorPopoverVisible"
        trigger="click"
        placement="bottom-start"
        :show-arrow="false"
        :width="280"
        :offset="8"
        popper-class="font-color-popper custom-popover"
      >
        <template #reference>
          <button class="toolbar-btn min-w-17 justify-between px-2" aria-label="字体颜色">
            <span class="flex items-center gap-1.5">
              <span
                class="font-color-swatch"
                :style="{
                  backgroundColor: currentFontColor,
                }"
              />
              <Baseline :size="18" />
            </span>
            <ChevronDown :size="14" class="opacity-70" />
          </button>
        </template>

        <ColorPickerPanel v-model="selectedFontColor" />
      </el-popover>

      <el-dropdown trigger="click" @command="handleLineHeight">
        <button class="toolbar-btn">
          <ListChevronsUpDown :size="18" />
          <ChevronDown :size="14" class="ml-0.5 opacity-70" />
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="lineHeight in lineHeightOptions"
              :key="String(lineHeight.value)"
              :command="lineHeight.value"
              :class="{ 'text-[#00dc82]! bg-gray-100!': isLineHeightActive(lineHeight.value) }"
            >
              <div class="flex items-center justify-center gap-2 py-1 min-w-12">
                {{ lineHeight.label }}
              </div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
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

      <el-popover
        trigger="click"
        :show-arrow="false"
        :width="230"
        popper-class="action-popper"
        placement="bottom"
      >
        <template #reference>
          <button class="toolbar-btn" :class="{ 'is-active': editor.isActive('highlight') }">
            <Highlighter :size="18" />
          </button>
        </template>

        <div class="flex items-center gap-1">
          <template v-for="color in highlightColors" :key="color">
            <button
              class="flex items-center justify-around rounded-xl w-8 h-8 hover:bg-gray-200 transition-colors"
              @click="editor.chain().focus().toggleHighlight({ color }).run()"
            >
              <span :style="{ backgroundColor: color }" class="w-5.25 h-5.25 rounded-[50%]" />
            </button>
          </template>
          <button
            class="flex items-center justify-around rounded-xl w-8 h-8 hover:bg-gray-200 transition-colors"
            @click="editor.chain().focus().unsetHighlight().run()"
          >
            <Ban :size="18" />
          </button>
        </div>
      </el-popover>

      <el-popover
        v-model:visible="linkPopoverVisible"
        trigger="click"
        placement="bottom"
        :show-arrow="false"
        :width="320"
        popper-class="action-popper"
        @show="syncLinkInput"
        @hide="handleLinkPopoverHide"
      >
        <template #reference>
          <button
            class="toolbar-btn"
            :class="{ 'is-active': editor.isActive('link') }"
            @mousedown.prevent="prepareLinkPlaceholder"
          >
            <LinkIcon :size="18" />
          </button>
        </template>

        <div class="link-popover-content">
          <el-input
            ref="linkInputRef"
            v-model="linkInput"
            class="link-popover-input"
            placeholder="请输入链接地址"
            @keydown.enter.prevent="applyLink"
          />

          <div class="link-popover-actions">
            <button type="button" class="link-popover-action-btn" @click="applyLink">
              <CornerDownLeft :size="16" />
            </button>
            <button type="button" class="link-popover-action-btn" @click="openLink">
              <ExternalLink :size="16" />
            </button>
            <button type="button" class="link-popover-action-btn" @click="removeLink">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </el-popover>
      <el-tooltip
        content="分割线"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button class="toolbar-btn" @click="editor.chain().focus().setHorizontalRule().run()">
          <Minus :size="18" />
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

    <div class="divider" />

    <div class="flex items-center gap-1 mx-2">
      <el-tooltip
        content="文字提取"
        placement="bottom"
        :show-after="200"
        :show-arrow="false"
        :offset="4"
      >
        <button class="toolbar-btn" @click="openOcrDrawer">
          <ScanText :size="18" />
        </button>
      </el-tooltip>

      <el-dropdown trigger="click" @command="handleInsertContents">
        <button class="toolbar-btn" :disabled="assetUploading">
          <Grid2X2Plus :size="18" />
          <ChevronDown :size="14" class="ml-1.5 opacity-70" />
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="1">
              <div class="flex items-center gap-3 py-1"><ImagePlus :size="18" /> 图片</div>
            </el-dropdown-item>
            <el-dropdown-item command="2">
              <div class="flex items-center gap-3 py-1"><AudioLines :size="18" /> 音频</div>
            </el-dropdown-item>
            <el-dropdown-item command="3">
              <div class="flex items-center gap-3 py-1"><FilePlusCorner :size="18" /> 文件</div>
            </el-dropdown-item>
            <el-dropdown-item command="4">
              <div class="flex items-center gap-3 py-1"><Table :size="18" /> 表格</div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>

  <el-drawer
    v-model="ocrDrawerVisible"
    direction="rtl"
    size="420px"
    :append-to-body="true"
    :show-close="false"
    class="custom-drawer"
  >
    <template #header>
      <h1 class="font-bold text-lg">文字提取</h1>
    </template>
    <template #default>
      <div class="flex h-full min-h-0 flex-col gap-5">
        <div
          v-loading="ocrRecognizing"
          element-loading-text="正在识别文字，请稍候..."
          class="flex-1 min-h-0 w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md gap-4 cursor-pointer"
          @click="!ocrImagePreviewUrl && triggerOcrImageUpload()"
        >
          <template v-if="ocrImagePreviewUrl">
            <el-image
              :src="ocrImagePreviewUrl"
              :preview-src-list="[ocrImagePreviewUrl]"
              fit="contain"
              preview-teleported
              class="h-full w-full rounded-md"
            />
            <el-button size="small" class="-translate-y-3" @click.stop="triggerOcrImageUpload"
              >更换图片</el-button
            >
          </template>
          <template v-else>
            <ImageUp :size="80" class="text-gray-300" />
            <p class="text-gray-500">请上传图片，系统将自动识别并提取文字</p>
          </template>
        </div>

        <div class="flex-1 min-h-0 w-full">
          <el-input
            v-model="ocrResult"
            class="ocr-result-input h-full w-full"
            type="textarea"
            resize="none"
            :disabled="ocrRecognizing"
            :input-style="{ height: '100%' }"
            placeholder="识别文本将显示在这里"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button @click="closeOcrDrawer">取消</el-button>
        <el-button type="primary" :disabled="ocrRecognizing" @click="handleOcrInsert"
          >插入</el-button
        >
      </div>
    </template>
  </el-drawer>

  <Dialog
    v-model="isTableDialogVisible"
    title="插入表格"
    :show-close="false"
    width="220px"
    @confirm="handleInsertTable"
  >
    <template #header>
      <div class="font-bold mb-3">插入表格</div>
    </template>

    <template #default>
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-500 w-7 shrink-0">行数</span>
          <el-input-number v-model="tableSize.rows" :min="1" :max="20" />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-500 w-7 shrink-0">列数</span>
          <el-input-number v-model="tableSize.cols" :min="1" :max="20" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
  @reference "tailwindcss";

  @layer components {
    .toolbar-btn {
      @apply p-1 rounded-md text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center min-w-8 h-8;
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

    .font-color-swatch {
      @apply w-3 h-3 rounded-full border shrink-0;
    }
  }
</style>

<style>
  .font-color-popper.el-popover {
    padding: 0;
  }

  .action-popper.el-popover {
    border-radius: 14px;
    padding: 8px 10px;
  }

  .link-popover-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .link-popover-input {
    flex: 1;
    min-width: 0;
  }

  .link-popover-input .el-input__wrapper {
    box-shadow: none;
    padding-left: 4px;
    padding-right: 4px;
    background: transparent;
  }

  .link-popover-input .el-input__wrapper.is-focus {
    box-shadow: none;
  }

  .link-popover-actions {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding-left: 8px;
    border-left: 1px solid #e5e7eb;
  }

  .link-popover-action-btn {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    color: #6b7280;
    background: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.16s ease;
  }

  .link-popover-action-btn:hover {
    background: #f3f4f6;
  }
</style>

<style>
  .custom-drawer .el-drawer__header {
    margin-bottom: 0;
  }

  .custom-drawer .ocr-result-input .el-textarea__inner {
    resize: none;
  }

  .custom-drawer .ocr-result-input .el-textarea {
    height: 100%;
  }

  .custom-popover.el-popover.el-popper {
    box-shadow: none;
    border: none;
  }
</style>
