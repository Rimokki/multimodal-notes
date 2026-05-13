<script lang="ts" setup>
  import { Trash2, RotateCcw } from 'lucide-vue-next'

  const authStore = useAuthStore()
  const { listNotes, restoreNote, purgeNote } = useNotesApi()

  useServerAuth()

  const loading = ref(false)
  const { ready, wait } = useMinimumDelay(500)
  const notes = ref<NoteItem[]>([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(5)
  const pageSizes = [5, 10, 20, 50]
  const purgeDialogVisible = ref(false)
  const purgeLoading = ref(false)
  const pendingPurgeNote = ref<NoteItem | null>(null)

  const fetchDeleted = async () => {
    return await listNotes('deleted', '', currentPage.value, pageSize.value)
  }

  const { data: deletedData } = await useAsyncData('recycle-bin', async () => {
    if (!authStore.isLoggedIn) return null
    return await fetchDeleted()
  })

  if (deletedData.value) {
    notes.value = deletedData.value.notes
    total.value = deletedData.value.total
    currentPage.value = deletedData.value.page
    pageSize.value = deletedData.value.pageSize
    ready.value = true
  } else if (deletedData.value === null && import.meta.server) {
    ready.value = true
  }

  const loadDeletedNotes = async () => {
    if (!authStore.isLoggedIn) {
      notes.value = []
      total.value = 0
      ready.value = false
      return
    }

    loading.value = true
    try {
      const response = await wait(fetchDeleted())
      notes.value = response.notes
      total.value = response.total
      currentPage.value = response.page
      pageSize.value = response.pageSize
    } catch (error: any) {
      if (import.meta.client) {
        ElMessage.error(error?.data?.statusMessage || error?.data?.message || '加载回收站失败')
      }
    } finally {
      loading.value = false
    }
  }

  const onCurrentPageChange = async (page: number) => {
    currentPage.value = page
    await loadDeletedNotes()
  }

  const onPageSizeChange = async (size: number) => {
    pageSize.value = size
    currentPage.value = 1
    await loadDeletedNotes()
  }

  const onRestore = async (note: NoteItem) => {
    try {
      await restoreNote(note.id)
      ElMessage.success('已恢复笔记')

      if (notes.value.length === 1 && currentPage.value > 1) {
        currentPage.value -= 1
      }

      await loadDeletedNotes()
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '恢复失败')
    }
  }

  const onPurge = (note: NoteItem) => {
    pendingPurgeNote.value = note
    purgeDialogVisible.value = true
  }

  const closePurgeDialog = () => {
    purgeDialogVisible.value = false
    pendingPurgeNote.value = null
  }

  const confirmPurge = async () => {
    if (!pendingPurgeNote.value) {
      return
    }

    purgeLoading.value = true
    try {
      await purgeNote(pendingPurgeNote.value.id)
      ElMessage.success('已彻底删除')
      closePurgeDialog()

      if (notes.value.length === 1 && currentPage.value > 1) {
        currentPage.value -= 1
      }

      await loadDeletedNotes()
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '删除失败')
    } finally {
      purgeLoading.value = false
    }
  }

  onMounted(async () => {
    if (!deletedData.value && authStore.isLoggedIn) {
      await loadDeletedNotes()
    }
  })
</script>

<template>
  <div class="max-w-5xl mx-auto px-3">
    <h1 class="font-bold text-2xl mt-2! mb-4!">回收站</h1>

    <el-alert
      v-if="!authStore.isLoggedIn"
      type="warning"
      :closable="false"
      show-icon
      class="font-bold"
    >
      请先登录后查看回收站
    </el-alert>

    <el-empty
      v-else-if="ready && !loading && notes.length === 0"
      description="回收站为空"
      class="min-h-[60vh] flex items-center justify-center"
    />

    <div v-else-if="!ready" class="grid gap-3">
      <el-card v-for="i in 3" :key="i" shadow="hover" class="rounded-xl!">
        <el-skeleton :rows="0" animated>
          <template #template>
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-3">
                  <el-skeleton-item variant="text" style="width: 35%; height: 22px" />
                  <el-skeleton-item
                    variant="button"
                    style="width: 48px; height: 22px; border-radius: 4px"
                  />
                </div>
                <el-skeleton-item variant="text" style="width: 100%" />
                <el-skeleton-item variant="text" style="width: 80%" />
              </div>
            </div>
          </template>
        </el-skeleton>
      </el-card>
    </div>

    <div v-else v-loading="loading" class="grid gap-3">
      <el-card v-for="note in notes" :key="note.id" shadow="hover" class="rounded-xl!">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-800">
              {{ note.title || '无标题笔记' }}
              <el-tag v-for="nt in note.tags" :key="nt.tag.id" size="small" class="ml-1!">
                {{ nt.tag.name }}
              </el-tag>
            </h3>
            <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ note.rawText || '暂无内容' }}</p>
            <p class="text-xs text-gray-400 mt-2">
              删除于 {{ new Date(note.deletedAt || note.updatedAt).toLocaleString() }}
            </p>
          </div>

          <div class="flex gap-2">
            <el-button :icon="RotateCcw" circle @click="onRestore(note)" />
            <el-button :icon="Trash2" circle type="danger" @click="onPurge(note)" />
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

    <Dialog
      v-model="purgeDialogVisible"
      :title="''"
      width="420px"
      confirm-text="彻底删除"
      cancel-text="取消"
      :confirm-loading="purgeLoading"
      :close-on-click-modal="!purgeLoading"
      @cancel="closePurgeDialog"
      @close="closePurgeDialog"
      @confirm="confirmPurge"
    >
      <template #header>
        <h3 class="text-base font-bold mb-3">危险操作</h3>
      </template>
      <p class="text-sm text-gray-600 leading-6">
        彻底删除后不可恢复，是否继续删除
        <span class="font-medium text-gray-900">{{ pendingPurgeNote?.title || '无标题笔记' }}</span>
        ？
      </p>
    </Dialog>
  </div>
</template>
