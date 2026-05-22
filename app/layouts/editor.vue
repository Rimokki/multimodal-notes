<script setup lang="ts">
  import { Star, Tag, Share2, Globe } from 'lucide-vue-next'

  const router = useRouter()
  const { toggleFavorite, getNoteTags, addNoteTag, removeNoteTag } = useNotesApi()
  const { createTag } = useTagsApi()
  const { toggleShare } = useCommunityApi()
  const { exportMarkdown, exportPdf, exportDocx } = useExport()
  const noteTitleVal = useState('noteTitle')
  const noteId = useState<number | null>('activeNoteId', () => null)
  const noteIsFavorite = useState('noteIsFavorite', () => false)
  const noteIsPublic = useState('noteIsPublic', () => false)
  const isOwner = useState('noteIsOwner', () => false)
  const noteSaveStatus = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'noteSaveStatus',
    () => 'idle',
  )
  const noteTitle = computed(() => noteTitleVal.value || '无标题笔记')
  const isEditing = useState('isEditing', () => true)
  const isMarked = computed(() => noteIsFavorite.value)
  const saveStatusText = computed(() => {
    if (noteSaveStatus.value === 'saving') return '保存中...'
    if (noteSaveStatus.value === 'saved') return '已保存'
    if (noteSaveStatus.value === 'error') return '保存失败'
    return ''
  })

  const isTagDialogVisible = ref(false)
  const noteTags = ref<{ id: number; name: string }[]>([])
  const tagInputValue = ref('')
  const tagInputVisible = ref(false)
  const tagInputRef = ref<InstanceType<(typeof import('element-plus'))['ElInput']>>()

  const openTagDialog = async () => {
    if (!noteId.value) {
      ElMessage.warning('当前笔记尚未初始化')
      return
    }
    isTagDialogVisible.value = true
    await loadNoteTags()
  }

  const loadNoteTags = async () => {
    if (!noteId.value) return
    try {
      const { tags } = await getNoteTags(noteId.value)
      noteTags.value = tags
    } catch {
      // ignore
    }
  }

  const handleTagClose = async (tag: { id: number; name: string }) => {
    if (!noteId.value) return
    try {
      await removeNoteTag(noteId.value, tag.id)
      noteTags.value = noteTags.value.filter((t) => t.id !== tag.id)
    } catch {
      ElMessage.error('移除标签失败')
    }
  }

  const showTagInput = () => {
    tagInputVisible.value = true
    nextTick(() => {
      tagInputRef.value?.focus()
    })
  }

  const handleTagInputConfirm = async () => {
    const name = tagInputValue.value.trim()
    if (!name || !noteId.value) {
      tagInputVisible.value = false
      tagInputValue.value = ''
      return
    }

    try {
      const existing = noteTags.value.find((t) => t.name === name)
      if (existing) {
        ElMessage.warning('标签已存在')
        tagInputValue.value = ''
        tagInputVisible.value = false
        return
      }

      const { tag } = await createTag(name)
      await addNoteTag(noteId.value, tag.id)
      noteTags.value.push(tag)
      ElMessage.success('标签已添加')
    } catch {
      ElMessage.error('添加标签失败')
    }

    tagInputValue.value = ''
    tagInputVisible.value = false
  }

  const isShareDialogVisible = ref(false)
  const isExportDialogVisible = ref(false)
  const exportType = ref('markdown')
  const exportOptions = [
    { label: 'Markdown', value: 'markdown' },
    { label: 'PDF', value: 'pdf' },
    { label: 'Word (DOCX)', value: 'docx' },
  ]
  const exportMessage = computed(() => {
    if (exportType.value === 'markdown') return `${noteTitle.value || 'note'}.md`
    if (exportType.value === 'pdf') return `${noteTitle.value || 'note'}.pdf`
    if (exportType.value === 'docx') return `${noteTitle.value || 'note'}.docx`
    return '文件'
  })

  const handleExport = () => {
    if (exportType.value === 'markdown') {
      exportMarkdown()
      isExportDialogVisible.value = false
    } else if (exportType.value === 'pdf') {
      exportPdf()
      isExportDialogVisible.value = false
    } else if (exportType.value === 'docx') {
      exportDocx()
      isExportDialogVisible.value = false
    } else ElMessage.error('未知的导出格式，请重新选择')
  }

  const toggleMark = async () => {
    if (!noteId.value) {
      ElMessage.warning('当前笔记尚未初始化')
      return
    }

    try {
      const { note } = await toggleFavorite(noteId.value)
      noteIsFavorite.value = note.isFavorite
      ElMessage.success(note.isFavorite ? '已收藏' : '已取消收藏')
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '收藏失败')
    }
  }

  const shareLoading = ref(false)

  const openShareDialog = () => {
    if (!noteId.value) {
      ElMessage.warning('当前笔记尚未初始化')
      return
    }
    isShareDialogVisible.value = true
  }

  const handleShareConfirm = async () => {
    if (!noteId.value) return

    shareLoading.value = true
    try {
      const { note } = await toggleShare(noteId.value)
      noteIsPublic.value = note.isPublic
      ElMessage.success(note.isPublic ? '笔记已公开分享' : '笔记已取消分享')
      isShareDialogVisible.value = false
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '操作失败')
    } finally {
      shareLoading.value = false
    }
  }

  const toggleEditMode = () => {
    isEditing.value = !isEditing.value
  }

  const goBack = () => {
    router.back()
  }
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <div class="w-1/6 border-r border-gray-200 flex flex-col min-h-0">
      <div class="my-6 mx-6 flex items-center justify-between">
        <span class="font-bold text-xl text-gray-500">目录</span>
        <div id="toc-actions-target" />
      </div>
      <div id="toc-target" class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-4" />
    </div>
    <div class="flex-1 flex flex-col">
      <div class="h-14 flex items-center justify-between px-10! border-b border-gray-200">
        <div class="ml-4 font-bold text-lg text-gray-600 flex items-center">
          <span class="text-lg">{{ noteTitle }}</span>
          <span class="font-normal text-sm ml-4! text-gray-400">
            {{ isEditing ? '编辑模式' : '预览模式' }}
          </span>
          <span v-if="saveStatusText" class="font-normal text-sm ml-3! text-gray-400">
            {{ saveStatusText }}
          </span>
        </div>

        <div class="flex items-center gap-2 mr-4">
          <el-button :type="isMarked ? 'warning' : ''" :icon="Star" circle @click="toggleMark" />
          <template v-if="isOwner">
            <el-tooltip
              :content="noteIsPublic ? '已分享' : '分享笔记'"
              placement="bottom"
              :show-arrow="false"
            >
              <el-button
                :type="noteIsPublic ? 'success' : ''"
                :icon="noteIsPublic ? Globe : Share2"
                circle
                @click="openShareDialog"
              />
            </el-tooltip>
            <el-tooltip content="标签" placement="bottom" :show-arrow="false">
              <el-button :icon="Tag" circle @click="openTagDialog" />
            </el-tooltip>
          </template>

          <el-button @click="isExportDialogVisible = !isExportDialogVisible">导出</el-button>
          <el-button v-if="isOwner" :type="isEditing ? '' : 'primary'" @click="toggleEditMode">
            {{ isEditing ? '预览' : '编辑' }}
          </el-button>
          <el-button class="ml-0!" @click="goBack">返回</el-button>
        </div>
      </div>

      <!-- 菜单栏挂载点 -->
      <div
        id="toolbar-target"
        class="border-b border-gray-200 bg-white z-10"
        :class="{ 'toolbar-hidden': !isEditing }"
      />

      <!-- 字数统计挂载点 -->
      <div v-show="isEditing" id="editor-character-count" class="fixed bottom-1 ml-2!" />

      <div
        id="editor-scroll-container"
        class="flex-1 py-10! overflow-y-auto overflow-x-hidden flex justify-center"
      >
        <slot />
      </div>
    </div>

    <Dialog
      v-model="isShareDialogVisible"
      width="400px"
      :confirm-text="noteIsPublic ? '取消分享' : '确认分享'"
      :confirm-loading="shareLoading"
      @confirm="handleShareConfirm"
      @cancel="isShareDialogVisible = false"
      @close="isShareDialogVisible = false"
    >
      <template #header>
        <div class="font-bold">{{ noteIsPublic ? '取消分享' : '分享笔记' }}</div>
      </template>
      <p class="text-gray-500 py-2">
        {{
          noteIsPublic
            ? '确定要取消分享吗？取消后其他用户将无法在知识社区中查看此笔记。'
            : '确定要分享此笔记吗？分享后所有用户都可以在知识社区中查看此笔记。'
        }}
      </p>
    </Dialog>

    <Dialog
      v-model="isExportDialogVisible"
      width="360px"
      :show-close="false"
      @cancel="isExportDialogVisible = false"
      @close="isExportDialogVisible = false"
      @confirm="handleExport"
    >
      <template #header>
        <div class="font-bold">导出笔记</div>
      </template>
      <div class="flex flex-col justify-center">
        <p class="text-gray-500 py-1.5">请选择导出格式：</p>
        <el-segmented
          v-model="exportType"
          :options="exportOptions"
          size="default"
          class="font-bold my-2"
        />
        <p class="text-gray-500 pt-1.5">
          文件将被导出为<span class="font-bold mx-1">{{ exportMessage }}</span>
        </p>
        <p v-if="exportType === 'pdf'" class="text-gray-500">
          请在弹出的对话框中<span class="font-bold">“目标打印机”</span>一栏选择
          <span class="font-bold">“另存为PDF” </span>，并取消勾选
          <span class="font-bold">“页眉和页脚”</span>进行保存
        </p>
        <p class="text-gray-500">
          因<span class="font-bold">平台差异</span>及<span class="font-bold">兼容性问题</span>，
          导出的文件在其它软件打开时可能<span class="font-bold">无法保留完整格式</span>，请知悉。
        </p>
      </div>
    </Dialog>

    <Dialog v-model="isTagDialogVisible" width="360px" :show-footer="false">
      <template #header>
        <div class="font-bold">笔记标签</div>
      </template>

      <div class="flex flex-wrap gap-2 my-3 min-h-8">
        <el-tag
          v-for="tag in noteTags"
          :key="tag.id"
          closable
          :disable-transitions="false"
          @close="handleTagClose(tag)"
        >
          {{ tag.name }}
        </el-tag>
        <el-input
          v-if="tagInputVisible"
          ref="tagInputRef"
          v-model="tagInputValue"
          class="w-20! h-6!"
          maxlength="15"
          size="small"
          @keyup.enter="handleTagInputConfirm"
          @blur="handleTagInputConfirm"
        />
        <el-button
          v-else
          class="button-new-tag"
          size="small"
          :disabled="noteTags.length >= 5"
          @click="showTagInput"
        >
          新建标签
        </el-button>
      </div>
      <p class="text-xs text-gray-400">输入标签后按回车添加，单个标签不大于15字，至多5个标签</p>
    </Dialog>
  </div>
</template>

<style scoped>
  .el-button + .el-button {
    margin-left: 0;
  }

  #toolbar-target {
    overflow: hidden;
    max-height: 56px;
    opacity: 1;
    transform: translateY(0);
    transition:
      max-height 0.28s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.24s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
      border-color 0.24s ease;
  }

  #toolbar-target.toolbar-hidden {
    max-height: 0;
    opacity: 0;
    transform: translateY(-10px);
    border-bottom-color: transparent;
    pointer-events: none;
  }

  #toc-target,
  #editor-scroll-container {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }

  #editor-scroll-container {
    scrollbar-gutter: stable;
  }

  #toc-target::-webkit-scrollbar,
  #editor-scroll-container::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  #toc-target::-webkit-scrollbar-track,
  #editor-scroll-container::-webkit-scrollbar-track {
    background: transparent;
  }

  #toc-target::-webkit-scrollbar-thumb,
  #editor-scroll-container::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 9999px;
    border: 2px solid transparent;
    background-clip: content-box;
  }

  #toc-target::-webkit-scrollbar-thumb:hover,
  #editor-scroll-container::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
    background-clip: content-box;
  }
</style>
