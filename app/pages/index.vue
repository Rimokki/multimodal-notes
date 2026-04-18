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

  const activeName = ref('edited')
  const loading = ref(false)
  const dashboardLoaded = ref(false)

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

  const loadDashboardData = async () => {
    if (!authStore.isLoggedIn) {
      editedNotes.value = []
      favoriteNotes.value = []
      deletedNotes.value = []
      totalNotes.value = 0
      totalFavorites.value = 0
      totalDeleted.value = 0
      dashboardLoaded.value = false
      return
    }

    loading.value = true
    try {
      const [editedResponse, favoriteResponse, deletedResponse] = await Promise.all([
        listNotes('all', '', 1, 5),
        listNotes('favorite', '', 1, 5),
        listNotes('deleted', '', 1, 5),
      ])

      editedNotes.value = editedResponse.notes.slice(0, 5)
      favoriteNotes.value = favoriteResponse.notes.slice(0, 5)
      deletedNotes.value = [...deletedResponse.notes]
        .sort((a, b) => {
          const timeA = new Date(a.deletedAt || a.updatedAt).getTime()
          const timeB = new Date(b.deletedAt || b.updatedAt).getTime()
          return timeB - timeA
        })
        .slice(0, 5)

      totalNotes.value = editedResponse.total
      totalFavorites.value = favoriteResponse.total
      totalDeleted.value = deletedResponse.total
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '加载工作台数据失败')
    } finally {
      dashboardLoaded.value = true
      loading.value = false
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
    await authStore.initialize()
    await loadDashboardData()
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
    <div class="flex items-center justify-between">
      <el-card shadow="hover" @click="handleCreateNote">
        <div class="flex items-center gap-2 py-1">
          <FilePlusCorner :size="28" /> 新建笔记 <Plus :size="24" class="ml-auto text-gray-400" />
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
    <el-alert
      v-if="!authStore.isLoggedIn"
      type="warning"
      :closable="false"
      show-icon
      class="mt-6! font-bold"
    >
      请先登录后查看工作台数据
    </el-alert>
    <div v-else v-loading="loading" class="mt-6">
      <el-tabs v-model="activeName" class="home-tabs">
        <el-tab-pane label="最近编辑" name="edited">
          <transition name="tab-fade-slide" mode="out-in">
            <div v-if="activeName === 'edited'" key="edited-panel">
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
                  <template #default="{ row }">
                    更新于 {{ formatDateTime(row.updatedAt) }}
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-else-if="dashboardLoaded && !loading" description="暂无最近编辑笔记" />
            </div>
          </transition>
        </el-tab-pane>
        <el-tab-pane label="最近收藏" name="favorite">
          <transition name="tab-fade-slide" mode="out-in">
            <div v-if="activeName === 'favorite'" key="favorite-panel">
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
                  <template #default="{ row }">
                    更新于 {{ formatDateTime(row.updatedAt) }}
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-else-if="dashboardLoaded && !loading" description="暂无收藏笔记" />
            </div>
          </transition>
        </el-tab-pane>
        <el-tab-pane label="最近删除" name="deleted">
          <transition name="tab-fade-slide" mode="out-in">
            <div v-if="activeName === 'deleted'" key="deleted-panel">
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
              <el-empty v-else-if="dashboardLoaded && !loading" description="暂无最近删除笔记" />
            </div>
          </transition>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped>
  .el-card {
    width: 24%;
    border-radius: 12px !important;
    border: 2px solid #e5e7eb !important;
    font-weight: 700;
    font-size: 18px;
  }

  .home-tabs :deep(.el-tabs__content) {
    font-weight: 600;
  }

  .home-tabs :deep(.el-tabs__item) {
    font-size: 16px;
    font-weight: 700;
  }

  .home-tabs :deep(.el-tabs__header) {
    margin-bottom: 1px;
  }

  .tab-fade-slide-enter-active,
  .tab-fade-slide-leave-active {
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
  }

  .tab-fade-slide-enter-from,
  .tab-fade-slide-leave-to {
    opacity: 0;
    transform: translateY(6px);
  }

  @media (prefers-reduced-motion: reduce) {
    .tab-fade-slide-enter-active,
    .tab-fade-slide-leave-active {
      transition: none;
    }
  }
</style>
