<script lang="ts" setup>
  import { Globe } from 'lucide-vue-next'

  definePageMeta({
    layout: 'editor',
  })

  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const { getNote, createNote, updateNote } = useNotesApi()

  const isEditing = useState('isEditing')

  const noteId = useState<number | null>('activeNoteId', () => null)
  const title = useState('noteTitle', () => '')
  const isFavorite = useState('noteIsFavorite', () => false)
  const noteIsPublic = useState('noteIsPublic', () => false)
  const saveStatus = useState<'idle' | 'saving' | 'saved' | 'error'>('noteSaveStatus', () => 'idle')
  const content = useState('noteContent', () => '')
  const editorRef = ref()
  const loading = ref(true)
  const bootstrapping = ref(true)
  const saveTimer = ref<ReturnType<typeof setTimeout> | null>(null)
  const isOwner = useState('noteIsOwner', () => false)

  const onTitleEnter = () => {
    editorRef.value?.focus()
  }

  const saveNow = async () => {
    if (!noteId.value || bootstrapping.value || !isOwner.value) {
      return
    }

    try {
      saveStatus.value = 'saving'
      const { note } = await updateNote(noteId.value, {
        title: title.value,
        content: content.value,
      })
      title.value = note.title
      isFavorite.value = note.isFavorite
      saveStatus.value = 'saved'
    } catch {
      saveStatus.value = 'error'
    }
  }

  const queueSave = () => {
    if (saveTimer.value) {
      clearTimeout(saveTimer.value)
    }

    saveTimer.value = setTimeout(() => {
      saveNow()
    }, 800)
  }

  watch([title, content], () => {
    if (bootstrapping.value || !noteId.value) {
      return
    }
    queueSave()
  })

  onBeforeUnmount(() => {
    if (saveTimer.value) {
      clearTimeout(saveTimer.value)
    }

    noteId.value = null
    title.value = ''
    content.value = ''
    isFavorite.value = false
    isOwner.value = false
    noteIsPublic.value = false
    isEditing.value = false
    loading.value = true
    bootstrapping.value = true
  })

  onMounted(async () => {
    const rawId = Number(route.query.id)

    // Clear stale state from previous note before loading new one
    noteId.value = null
    title.value = ''
    content.value = ''
    isFavorite.value = false
    isOwner.value = false
    noteIsPublic.value = false

    // Set initial editing state to prevent stale value from previous session
    if (!Number.isInteger(rawId) || rawId <= 0) {
      isEditing.value = true
    } else {
      isEditing.value = false
    }

    try {
      if (Number.isInteger(rawId) && rawId > 0) {
        const { note } = await getNote(rawId)
        noteId.value = note.id
        title.value = note.title
        content.value = note.content
        isFavorite.value = note.isFavorite
        isOwner.value = note.isOwner ?? false
        noteIsPublic.value = note.isPublic ?? false

        if (isOwner.value) {
          isEditing.value = true
        }
      } else {
        if (!authStore.isLoggedIn) {
          ElMessage.warning('请先登录后再创建笔记')
          await router.push('/')
          return
        }

        const { note } = await createNote({
          title: '无标题笔记',
          content: '',
        })
        noteId.value = note.id
        title.value = note.title
        content.value = note.content
        isFavorite.value = note.isFavorite
        isOwner.value = true
        noteIsPublic.value = false
        await router.replace(`/editor?id=${note.id}`)
      }

      saveStatus.value = 'saved'
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '加载笔记失败')
      await router.push('/my-notes')
    } finally {
      bootstrapping.value = false
      loading.value = false
    }
  })
</script>

<template>
  <div v-loading="loading" class="w-3xl mx-auto">
    <div
      v-if="!isOwner && noteId"
      class="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg mb-4 flex items-center gap-2"
    >
      <Globe :size="16" />
      <span class="font-medium">您正在以只读模式查看他人的公开笔记</span>
    </div>
    <div class="mb-4!">
      <el-input
        v-if="isEditing"
        v-model="title"
        placeholder="请输入标题"
        class="note-title-input text-3xl font-bold border-none shadow-none resize-none bg-transparent pl-5"
        resize="none"
        type="textarea"
        maxlength="40"
        autosize
        @keydown.enter.prevent="onTitleEnter"
      />

      <h1
        v-else
        class="text-4xl font-bold text-gray-900 leading-tight wrap-break-word whitespace-pre-wrap pl-5"
      >
        {{ title || '无标题笔记' }}
      </h1>
    </div>

    <div v-show="!loading && isEditing">
      <Editor ref="editorRef" v-model="content" />
    </div>

    <div v-show="!loading && !isEditing">
      <Previewer :content="content" />
    </div>
  </div>
</template>

<style scoped>
  :deep(.note-title-input .el-textarea__inner) {
    padding: 0 !important;
    box-shadow: none !important;
    font-size: 36px !important;
    min-height: 40px !important;
  }

  :deep(.note-title-input .el-textarea__inner::placeholder) {
    color: #d1d5dc !important;
  }
</style>
