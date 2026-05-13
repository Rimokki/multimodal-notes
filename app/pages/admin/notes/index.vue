<script lang="ts" setup>
  import { Search, Trash2 } from 'lucide-vue-next'

  definePageMeta({ layout: 'default' })

  const { listNotes, deleteNote } = useAdminApi()
  const authStore = useAuthStore()

  useServerAuth()

  const { ready, wait } = useMinimumDelay(500)
  const notes = ref<any[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(10)
  const keyword = ref('')
  const deleteDialogVisible = ref(false)
  const noteToDelete = ref<any>(null)

  const formatDateTime = (value: string | null) => {
    if (!value) return '-'
    return new Date(value).toLocaleString()
  }

  const fetchAdminNotes = async () => {
    return await listNotes(page.value, pageSize.value, keyword.value || undefined)
  }

  const { data: adminNotesData } = await useAsyncData('admin-notes', async () => {
    if (!authStore.isLoggedIn) return null
    return await fetchAdminNotes()
  })

  if (adminNotesData.value) {
    notes.value = adminNotesData.value.notes
    total.value = adminNotesData.value.total
    ready.value = true
  } else if (adminNotesData.value === null && import.meta.server) {
    ready.value = true
  }

  const loadNotes = async () => {
    try {
      const res = await wait(fetchAdminNotes())
      notes.value = res.notes
      total.value = res.total
    } catch (error: any) {
      if (import.meta.client) {
        ElMessage.error(error?.data?.statusMessage || '加载笔记列表失败')
      }
    }
  }

  const confirmDelete = (note: any) => {
    noteToDelete.value = note
    deleteDialogVisible.value = true
  }

  const handleDelete = async () => {
    if (!noteToDelete.value) return
    try {
      await deleteNote(noteToDelete.value.id)
      ElMessage.success('笔记已删除')
      deleteDialogVisible.value = false
      noteToDelete.value = null
      await loadNotes()
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || '删除失败')
    }
  }

  const handleSearch = () => {
    page.value = 1
    loadNotes()
  }

  const handlePageChange = (newPage: number) => {
    page.value = newPage
    loadNotes()
  }

  const handleSizeChange = (newSize: number) => {
    pageSize.value = newSize
    page.value = 1
    loadNotes()
  }

  onMounted(async () => {
    if (!adminNotesData.value && authStore.isLoggedIn) {
      await loadNotes()
    }
  })
</script>

<template>
  <div class="max-w-5xl mx-auto px-3">
    <div class="flex items-center justify-between mt-2! mb-6!">
      <h1 class="font-bold text-2xl">笔记管理</h1>
      <el-input
        v-model="keyword"
        style="width: 240px"
        placeholder="搜索标题、内容或用户名"
        clearable
        :prefix-icon="Search"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
    </div>
    <div class="rounded-xl overflow-hidden border-2 border-gray-200 p-4 pt-2">
      <template v-if="!ready">
        <el-skeleton :rows="0" animated>
          <template #template>
            <div v-for="i in 5" :key="i" class="flex items-center" style="height: 60px">
              <div style="width: 60px">
                <el-skeleton-item variant="text" style="width: 30px; height: 16px" />
              </div>
              <div style="min-width: 150px; flex: 1">
                <el-skeleton-item variant="text" style="width: 60%; height: 16px" />
              </div>
              <div style="min-width: 200px; flex: 1">
                <el-skeleton-item variant="text" style="width: 80%; height: 16px" />
              </div>
              <div style="min-width: 140px">
                <el-skeleton-item variant="text" style="width: 50%; height: 16px" />
              </div>
              <div style="width: 170px">
                <el-skeleton-item variant="text" style="width: 70%; height: 16px" />
              </div>
              <div style="width: 80px; display: flex; justify-content: center">
                <el-skeleton-item variant="circle" style="width: 32px; height: 32px" />
              </div>
            </div>
          </template>
        </el-skeleton>
      </template>
      <template v-else>
        <el-table :data="notes" style="width: 100%" :row-style="{ height: '60px' }">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="title" label="标题" min-width="150">
            <template #default="{ row }">
              {{ row.title || '无标题笔记' }}
            </template>
          </el-table-column>
          <el-table-column label="摘要" min-width="200">
            <template #default="{ row }">
              <span class="text-gray-500 truncate block" style="max-width: 240px">
                {{ row.excerpt || '暂无内容' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="作者" min-width="140">
            <template #default="{ row }">
              {{ row.owner?.username || row.owner?.email || '已删除用户' }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.isDeleted ? 'info' : 'success'" size="small">
                {{ row.isDeleted ? '已删除' : '正常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" width="170">
            <template #default="{ row }">
              {{ formatDateTime(row.updatedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ row }">
              <el-button type="danger" :icon="Trash2" circle @click="confirmDelete(row)" />
            </template>
          </el-table-column>
        </el-table>
      </template>
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          class="my-2"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <Dialog v-model="deleteDialogVisible" title="确认删除" width="400px">
      <p>确定要永久删除笔记「{{ noteToDelete?.title || '无标题笔记' }}」吗？此操作不可撤销。</p>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleDelete">确认删除</el-button>
      </template>
    </Dialog>
  </div>
</template>
