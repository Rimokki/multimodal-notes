<script lang="ts" setup>
  import {
    Notebook,
    Star,
    Trash,
    NotepadText,
    NotepadTextDashed,
    FilePlusCorner,
    Plus,
  } from 'lucide-vue-next'
  import type { NoteItem } from '~/composables/useNotesApi'

  const router = useRouter()
  const authStore = useAuthStore()
  const { listNotes, createNote } = useNotesApi()

  useServerAuth()

  const { ready, wait } = useMinimumDelay(700)
  const notesType = ref('最近编辑')

  const editedNotes = ref<NoteItem[]>([])
  const favoriteNotes = ref<NoteItem[]>([])
  const deletedNotes = ref<NoteItem[]>([])

  const totalNotes = ref(0)
  const totalFavorites = ref(0)
  const totalDeleted = ref(0)

  const formatDateTime = (value: string | null) => {
    if (!value) {
      return '-'
    }

    return new Date(value).toLocaleString()
  }

  const toRowTitle = (note: NoteItem) => {
    return note.title?.trim() || '无标题笔记'
  }

  const toRowSummary = (note: NoteItem) => {
    const raw = note.rawText?.trim()
    if (raw) {
      return raw
    }

    const plain = note.content
      ?.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return plain || '暂无摘要'
  }

  const applyDashboardData = (data: {
    editedNotes: NoteItem[]
    favoriteNotes: NoteItem[]
    deletedNotes: NoteItem[]
    totalNotes: number
    totalFavorites: number
    totalDeleted: number
  }) => {
    editedNotes.value = data.editedNotes
    favoriteNotes.value = data.favoriteNotes
    deletedNotes.value = data.deletedNotes
    totalNotes.value = data.totalNotes
    totalFavorites.value = data.totalFavorites
    totalDeleted.value = data.totalDeleted
  }

  const resetDashboardData = () => {
    editedNotes.value = []
    favoriteNotes.value = []
    deletedNotes.value = []
    totalNotes.value = 0
    totalFavorites.value = 0
    totalDeleted.value = 0
  }

  const fetchDashboardData = async () => {
    const [editedResponse, favoriteResponse, deletedResponse] = await Promise.all([
      listNotes('all', '', 1, 5),
      listNotes('favorite', '', 1, 5),
      listNotes('deleted', '', 1, 5),
    ])
    return {
      editedNotes: editedResponse.notes.slice(0, 5),
      favoriteNotes: favoriteResponse.notes.slice(0, 5),
      deletedNotes: [...deletedResponse.notes]
        .sort((a, b) => {
          const timeA = new Date(a.deletedAt || a.updatedAt).getTime()
          const timeB = new Date(b.deletedAt || b.updatedAt).getTime()
          return timeB - timeA
        })
        .slice(0, 5),
      totalNotes: editedResponse.total,
      totalFavorites: favoriteResponse.total,
      totalDeleted: deletedResponse.total,
    }
  }

  const { data: dashboardData } = await useAsyncData('dashboard', async () => {
    if (!authStore.isLoggedIn) return null
    return await fetchDashboardData()
  })

  if (dashboardData.value) {
    applyDashboardData(dashboardData.value)
    ready.value = true
  } else if (dashboardData.value === null && import.meta.server) {
    ready.value = true
  }

  const loadDashboardData = async () => {
    if (!authStore.isLoggedIn) {
      resetDashboardData()
      ready.value = false
      return
    }

    try {
      const data = await wait(fetchDashboardData())
      applyDashboardData(data)
    } catch (error: any) {
      if (import.meta.client) {
        ElMessage.error(error?.data?.statusMessage || error?.data?.message || '加载工作台数据失败')
      }
    }
  }

  const openNote = async (noteId: number) => {
    await router.push(`/editor?id=${noteId}`)
  }

  const handleCreateNote = async () => {
    if (!authStore.isLoggedIn) {
      ElMessage.warning('请先登录后再创建笔记')
      return
    }

    try {
      const { note } = await createNote({
        title: '无标题笔记',
        content: '',
      })
      await router.push(`/editor?id=${note.id}`)
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '创建笔记失败')
    }
  }

  onMounted(async () => {
    if (!dashboardData.value && authStore.isLoggedIn) {
      await loadDashboardData()
    }
  })

  watch(
    () => authStore.isLoggedIn,
    async () => {
      await loadDashboardData()
    },
  )
</script>

<template>
  <div class="max-w-5xl mx-auto px-3">
    <div class="flex items-center justify-between mt-2! mb-6!">
      <h1 class="font-bold text-2xl">工作台</h1>
    </div>

    <el-alert
      v-if="!authStore.isLoggedIn"
      type="warning"
      :closable="false"
      show-icon
      class="mt-6! font-bold"
    >
      请先登录后查看工作台数据
    </el-alert>

    <template v-else-if="!ready">
      <div class="flex items-center justify-between">
        <el-card v-for="i in 4" :key="i" shadow="hover">
          <el-skeleton :rows="0" animated>
            <template #template>
              <div class="flex items-center gap-2 py-1">
                <el-skeleton-item variant="circle" style="width: 28px; height: 28px" />
                <el-skeleton-item variant="text" style="width: 40%; height: 20px" />
                <el-skeleton-item
                  variant="text"
                  style="width: 20%; height: 20px; margin-left: auto"
                />
              </div>
            </template>
          </el-skeleton>
        </el-card>
      </div>
      <div class="mt-6">
        <div class="custom-segmented">
          <el-segmented
            v-model="notesType"
            :options="['最近编辑', '最近收藏', '最近删除']"
            size="large"
          />
        </div>
        <el-skeleton :rows="0" animated>
          <template #template>
            <div v-for="i in 5" :key="i" class="flex items-center" style="height: 80px">
              <div style="min-width: 120px">
                <el-skeleton-item variant="text" style="width: 70%; height: 16px" />
              </div>
              <div class="flex-1 px-4">
                <el-skeleton-item variant="text" style="width: 90%; height: 16px" />
              </div>
              <div style="width: 220px; text-align: right">
                <el-skeleton-item
                  variant="text"
                  style="width: 60%; height: 16px; margin-left: auto"
                />
              </div>
            </div>
          </template>
        </el-skeleton>
      </div>
    </template>

    <template v-else>
      <div class="flex items-center justify-between">
        <el-card shadow="hover" @click="handleCreateNote">
          <div class="flex items-center gap-2 py-1">
            <FilePlusCorner :size="28" /> 新建笔记
            <Plus :size="24" class="ml-auto text-gray-400" />
          </div>
        </el-card>
        <el-card shadow="hover" @click="() => $router.push('/my-notes')">
          <div class="flex items-center gap-2 py-1">
            <NotepadText :size="28" /> 笔记 <span class="ml-auto">{{ totalNotes }} 篇</span>
          </div>
        </el-card>
        <el-card shadow="hover" @click="() => $router.push('/favourite')">
          <div class="flex items-center gap-2 py-1">
            <Star :size="28" /> 收藏 <span class="ml-auto">{{ totalFavorites }} 篇</span>
          </div>
        </el-card>
        <el-card shadow="hover" @click="() => $router.push('/recycle-bin')">
          <div class="flex items-center gap-2 py-1">
            <Trash :size="28" /> 回收站 <span class="ml-auto">{{ totalDeleted }} 篇</span>
          </div>
        </el-card>
      </div>
      <div class="mt-6">
        <div class="custom-segmented">
          <el-segmented
            v-model="notesType"
            :options="['最近编辑', '最近收藏', '最近删除']"
            size="large"
          />
        </div>

        <template v-if="notesType === '最近编辑'">
          <el-table
            v-if="editedNotes.length"
            :data="editedNotes"
            style="width: 100%"
            :show-header="false"
            :row-style="{ height: '80px' }"
          >
            <el-table-column label="标题" min-width="120">
              <template #default="{ row }">
                <span
                  class="flex w-full min-w-0 items-center gap-1 cursor-pointer text-gray-700 hover:text-green-400"
                  @click="openNote(row.id)"
                >
                  <Notebook :size="20" class="shrink-0" />
                  <span class="min-w-0 truncate">{{ toRowTitle(row) }}</span>
                </span>
              </template>
            </el-table-column>
            <el-table-column label="摘要" min-width="260">
              <template #default="{ row }">
                <span class="block text-gray-500 truncate">{{ toRowSummary(row) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="时间" width="220" align="right">
              <template #default="{ row }"> 更新于 {{ formatDateTime(row.updatedAt) }} </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无最近编辑笔记" />
        </template>

        <template v-if="notesType === '最近收藏'">
          <el-table
            v-if="favoriteNotes.length"
            :data="favoriteNotes"
            style="width: 100%"
            :show-header="false"
            :row-style="{ height: '80px' }"
          >
            <el-table-column label="标题" min-width="120">
              <template #default="{ row }">
                <span
                  class="flex w-full min-w-0 items-center gap-1 cursor-pointer text-gray-700 hover:text-green-400"
                  @click="openNote(row.id)"
                >
                  <Notebook :size="20" class="shrink-0" />
                  <span class="min-w-0 truncate">{{ toRowTitle(row) }}</span>
                </span>
              </template>
            </el-table-column>
            <el-table-column label="摘要" min-width="260">
              <template #default="{ row }">
                <span class="block text-gray-500 truncate">{{ toRowSummary(row) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="时间" width="220" align="right">
              <template #default="{ row }"> 更新于 {{ formatDateTime(row.updatedAt) }} </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无收藏笔记" />
        </template>

        <template v-if="notesType === '最近删除'">
          <el-table
            v-if="deletedNotes.length"
            :data="deletedNotes"
            style="width: 100%"
            :show-header="false"
            :row-style="{ height: '80px' }"
          >
            <el-table-column label="标题" min-width="120">
              <template #default="{ row }">
                <span
                  class="flex w-full min-w-0 items-center gap-1"
                  @click="() => $router.push('/recycle-bin')"
                >
                  <NotepadTextDashed :size="20" class="shrink-0" />
                  <span class="min-w-0 truncate">{{ toRowTitle(row) }}</span>
                </span>
              </template>
            </el-table-column>
            <el-table-column label="摘要" min-width="260">
              <template #default="{ row }">
                <span class="block text-gray-500 truncate">{{ toRowSummary(row) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="时间" width="220" align="right">
              <template #default="{ row }">
                删除于 {{ formatDateTime(row.deletedAt || row.updatedAt) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无最近删除笔记" />
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
  .custom-segmented .el-segmented {
    font-weight: 600;
    margin-bottom: 8px;
    --el-border-radius-base: 8px;
  }

  .el-card {
    width: 24%;
    border-radius: 12px !important;
    border: 2px solid #e5e7eb !important;
    font-weight: 700;
    font-size: 18px;
  }

  .el-table {
    font-weight: 600;
  }
</style>
