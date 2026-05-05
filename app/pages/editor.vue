<script lang="ts" setup>
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
  const saveStatus = useState<'idle' | 'saving' | 'saved' | 'error'>('noteSaveStatus', () => 'idle')
  const content = useState('noteContent', () => '')
  const editorRef = ref()
  const loading = ref(true)
  const bootstrapping = ref(true)
  const saveTimer = ref<ReturnType<typeof setTimeout> | null>(null)

  const onTitleEnter = () => {
    editorRef.value?.focus()
  }

  const saveNow = async () => {
    if (!noteId.value || bootstrapping.value) {
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
  })

  onMounted(async () => {
    await authStore.initialize()
    if (!authStore.isLoggedIn) {
      ElMessage.warning('请先登录后再编辑笔记')
      await router.push('/')
      return
    }

    const rawId = Number(route.query.id)

    try {
      if (Number.isInteger(rawId) && rawId > 0) {
        const { note } = await getNote(rawId)
        noteId.value = note.id
        title.value = note.title
        content.value = note.content
        isFavorite.value = note.isFavorite
      } else {
        const { note } = await createNote({
          title: '无标题笔记',
          content: '',
        })
        noteId.value = note.id
        title.value = note.title
        content.value = note.content
        isFavorite.value = note.isFavorite
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

<style lang="postcss" scoped>
  :deep(.note-title-input .el-textarea__inner) {
    padding: 0 !important;
    box-shadow: none !important;
    font-size: 36px !important;
    min-height: 40px !important;
  }

  :deep(.note-title-input .el-textarea__inner::placeholder) {
    @apply text-gray-300;
  }
</style>
