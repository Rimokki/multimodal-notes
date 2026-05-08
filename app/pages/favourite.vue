<script lang="ts" setup>
  import { Star } from 'lucide-vue-next'

  const router = useRouter()
  const authStore = useAuthStore()
  const { listNotes, toggleFavorite } = useNotesApi()

  const loading = ref(false)
  const notesLoaded = ref(false)
  const notes = ref<NoteItem[]>([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(5)
  const pageSizes = [5, 10, 20, 50]

  const loadFavoriteNotes = async () => {
    if (!authStore.isLoggedIn) {
      notes.value = []
      total.value = 0
      notesLoaded.value = false
      return
    }

    loading.value = true
    try {
      const response = await listNotes('favorite', '', currentPage.value, pageSize.value)
      notes.value = response.notes
      total.value = response.total
      currentPage.value = response.page
      pageSize.value = response.pageSize
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '加载收藏失败')
    } finally {
      notesLoaded.value = true
      loading.value = false
    }
  }

  const onCurrentPageChange = async (page: number) => {
    currentPage.value = page
    await loadFavoriteNotes()
  }

  const onPageSizeChange = async (size: number) => {
    pageSize.value = size
    currentPage.value = 1
    await loadFavoriteNotes()
  }

  const openNote = async (noteId: number) => {
    await router.push(`/editor?id=${noteId}`)
  }

  const removeFavorite = async (note: NoteItem) => {
    try {
      await toggleFavorite(note.id, false)
      ElMessage.success('已取消收藏')

      if (notes.value.length === 1 && currentPage.value > 1) {
        currentPage.value -= 1
      }

      await loadFavoriteNotes()
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '操作失败')
    }
  }

  onMounted(async () => {
    await authStore.initialize()
    await loadFavoriteNotes()
  })
</script>

<template>
  <div class="max-w-5xl mx-auto px-3">
    <h1 class="font-bold text-2xl mt-2! mb-4!">我的收藏</h1>

    <el-alert
      v-if="!authStore.isLoggedIn"
      type="warning"
      :closable="false"
      show-icon
      class="font-bold"
    >
      请先登录后查看收藏
    </el-alert>

    <el-empty
      v-else-if="notesLoaded && !loading && notes.length === 0"
      description="你还没有收藏任何笔记"
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

          <el-button :icon="Star" circle type="warning" @click="removeFavorite(note)" />
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
