<script lang="ts" setup>
  import type { Editor } from '@tiptap/vue-3'
  import { onBeforeUnmount, ref } from 'vue'
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
  } from 'lucide-vue-next'
  import { createWorker } from 'tesseract.js'

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
  const assetUploading = ref(false)
  const ocrDrawerVisible = ref(false)
  const ocrResult = ref('')
  const ocrImagePreviewUrl = ref('')
  const ocrRecognizing = ref(false)

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

  const handleInsertContents = (command: string) => {
    if (command === '1') {
      imageInputRef.value?.click()
    } else if (command === '2') {
      audioInputRef.value?.click()
    } else if (command === '3') {
      fileInputRef.value?.click()
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
</style>
