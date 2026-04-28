<script setup lang="ts">
  import { StarFilled } from '@element-plus/icons-vue'

  const router = useRouter()
  const { toggleFavorite } = useNotesApi()
  const noteTitleVal = useState('noteTitle')
  const noteId = useState<number | null>('activeNoteId', () => null)
  const noteIsFavorite = useState('noteIsFavorite', () => false)
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
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '收藏操作失败')
    }
  }

  const toggleEditMode = () => {
    isEditing.value = !isEditing.value
  }

  const goBack = () => {
    router.push('/')
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

        <div class="mr-4">
          <el-button
            :type="isMarked ? 'warning' : ''"
            :icon="StarFilled"
            circle
            @click="toggleMark"
          />
          <el-button>分享</el-button>
          <el-button :type="isEditing ? '' : 'primary'" @click="toggleEditMode">
            {{ isEditing ? '预览' : '编辑' }}
          </el-button>
          <el-button @click="goBack">返回</el-button>
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
  </div>
</template>

<style scoped>
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
