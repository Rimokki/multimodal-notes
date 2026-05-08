<script lang="ts" setup>
  import { Trash2, Star } from 'lucide-vue-next'

  const router = useRouter()
  const authStore = useAuthStore()
  const { listNotes, toggleFavorite, moveToRecycle } = useNotesApi()

  const loading = ref(false)
  const notesLoaded = ref(false)
  const keyword = ref('')
  const notes = ref<NoteItem[]>([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(5)
  const pageSizes = [5, 10, 20, 50]

  const loadNotes = async (resetPage = false) => {
    if (resetPage) {
      currentPage.value = 1
    }

    if (!authStore.isLoggedIn) {
      notes.value = []
      total.value = 0
      notesLoaded.value = false
      return
    }

    loading.value = true
    try {
      const response = await listNotes('all', keyword.value, currentPage.value, pageSize.value)
      notes.value = response.notes
      total.value = response.total
      currentPage.value = response.page
      pageSize.value = response.pageSize
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '加载笔记失败')
    } finally {
      notesLoaded.value = true
      loading.value = false
    }
  }

  const onSearch = async () => {
    await loadNotes(true)
  }

  const onCurrentPageChange = async (page: number) => {
    currentPage.value = page
    await loadNotes()
  }

  const onPageSizeChange = async (size: number) => {
    pageSize.value = size
    currentPage.value = 1
    await loadNotes()
  }

  const openNote = async (noteId: number) => {
    await router.push(`/editor?id=${noteId}`)
  }

  const onToggleFavorite = async (note: NoteItem) => {
    try {
      const response = await toggleFavorite(note.id, !note.isFavorite)
      note.isFavorite = response.note.isFavorite
      ElMessage.success(note.isFavorite ? '已收藏' : '已取消收藏')
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '收藏操作失败')
    }
  }

  const onDelete = async (note: NoteItem) => {
    try {
      await moveToRecycle(note.id)
      ElMessage.success('已移入回收站')
      await loadNotes()
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '删除失败')
    }
  }

  onMounted(async () => {
    await authStore.initialize()
    await loadNotes()
  })
</script>

<template>
  <div class="max-w-5xl mx-auto px-3">
    <div class="flex items-center justify-between mt-2! mb-4!">
      <h1 class="font-bold text-2xl">我的笔记</h1>
      <el-input
        v-model="keyword"
        placeholder="按标题或内容搜索"
        style="width: 280px"
        clearable
        @keyup.enter="onSearch"
        @clear="onSearch"
      >
        <template #append>
          <el-button @click="onSearch">搜索</el-button>
        </template>
      </el-input>
    </div>

    <el-alert
      v-if="!authStore.isLoggedIn"
      type="warning"
      :closable="false"
      show-icon
      class="font-bold"
    >
      请先登录后查看你的笔记
    </el-alert>

    <el-empty
      v-else-if="notesLoaded && !loading && notes.length === 0"
      description="还没有笔记，点击左侧 + 创建第一篇"
      class="min-h-[60vh] flex items-center justify-center"
    />

    <div v-else v-loading="loading" class="grid gap-3">
      <el-card v-for="note in notes" :key="note.id" shadow="hover" class="rounded-xl!">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 cursor-pointer" @click="openNote(note.id)">
            <h3 class="text-lg font-semibold text-gray-800">{{ note.title || '无标题笔记' }}</h3>
            <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ note.rawText || '暂无内容' }}</p>
            <p class="text-xs text-gray-400 mt-2">
              更新于 {{ new Date(note.updatedAt).toLocaleString() }}
            </p>
          </div>

          <div class="flex gap-2">
            <el-button
              :type="note.isFavorite ? 'warning' : ''"
              :icon="Star"
              circle
              @click="onToggleFavorite(note)"
            />
            <el-button :icon="Trash2" circle @click="onDelete(note)" />
          </div>
        </div>
      </el-card>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        hide-on-single-page
        background
        :page-sizes="pageSizes"
        layout="total, sizes, prev, pager, next"
        :total="total"
        class="font-medium! my-1.75! ml-auto"
        @current-change="onCurrentPageChange"
        @size-change="onPageSizeChange"
      />
    </div>
  </div>
</template>

<style lang="postcss" scoped></style>
