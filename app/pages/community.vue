<script lang="ts" setup>
import { Heart } from 'lucide-vue-next'
import type { CommunityNoteItem } from '~/composables/useCommunityApi'

const router = useRouter()
const authStore = useAuthStore()
const { listCommunityNotes, toggleLike } = useCommunityApi()

const loading = ref(false)
const { ready, wait } = useMinimumDelay(500)
const keyword = ref('')
const notes = ref<CommunityNoteItem[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)
const pageSizes = [12, 24, 48]
const sortBy = ref<'updatedAt' | 'likes'>('updatedAt')

const loadNotes = async (resetPage = false) => {
  if (resetPage) currentPage.value = 1

  loading.value = true
  try {
    const response = await wait(
      listCommunityNotes(keyword.value, currentPage.value, pageSize.value, sortBy.value),
    )
    notes.value = response.notes
    total.value = response.total
    currentPage.value = response.page
    pageSize.value = response.pageSize
  } catch (error: any) {
    ElMessage.error(error?.data?.statusMessage || error?.data?.message || '加载社区笔记失败')
  } finally {
    loading.value = false
  }
}

const onSearch = () => loadNotes(true)
const onCurrentPageChange = (page: number) => { currentPage.value = page; loadNotes() }
const onPageSizeChange = (size: number) => { pageSize.value = size; currentPage.value = 1; loadNotes() }
const onSortChange = () => loadNotes(true)

const openNote = (noteId: number) => router.push(`/editor?id=${noteId}`)

const onToggleLike = async (note: CommunityNoteItem) => {
  if (!authStore.isLoggedIn) {
    ElMessage.warning('请先登录后才能点赞')
    return
  }
  try {
    const result = await toggleLike(note.id)
    note.isLiked = result.liked
    note.likeCount = result.likeCount
  } catch (error: any) {
    ElMessage.error(error?.data?.statusMessage || error?.data?.message || '操作失败')
  }
}

const formatDateTime = (value: string) => {
  return new Date(value).toLocaleString()
}

onMounted(() => {
  if (authStore.isLoggedIn) {
    loadNotes()
  } else {
    ready.value = true
  }
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-3">
    <div class="flex items-center justify-between mt-2! mb-4!">
      <h1 class="font-bold text-2xl">知识社区</h1>
      <div class="flex items-center gap-3">
        <el-select v-model="sortBy" style="width: 120px" @change="onSortChange">
          <el-option label="最近更新" value="updatedAt" />
          <el-option label="最多点赞" value="likes" />
        </el-select>
        <el-input
          v-model="keyword"
          placeholder="搜索公开笔记"
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
    </div>

    <el-alert
      v-if="!authStore.isLoggedIn"
      type="warning"
      :closable="false"
      show-icon
      class="font-bold"
    >
      请先登录后浏览知识社区
    </el-alert>

    <el-empty
      v-else-if="ready && !loading && notes.length === 0"
      description="还没有公开笔记，去分享你的第一篇笔记吧"
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
                  <el-skeleton-item variant="button" style="width: 48px; height: 22px; border-radius: 4px" />
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
          <div class="flex-1 cursor-pointer" @click="openNote(note.id)">
            <h3 class="text-lg font-semibold text-gray-800">
              {{ note.title || '无标题笔记' }}
              <el-tag v-for="nt in note.tags" :key="nt.tag.id" size="small" class="ml-1!">
                {{ nt.tag.name }}
              </el-tag>
            </h3>
            <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ note.rawText || '暂无内容' }}</p>
            <div class="flex items-center gap-2 mt-2">
              <el-avatar v-if="note.owner" :src="note.owner.avatarUrl || '/images/original_avatar.png'" :size="20" />
              <span class="text-xs text-gray-400">
                {{ note.owner?.username || '未知用户' }}
              </span>
              <span class="text-xs text-gray-400">· 更新于 {{ formatDateTime(note.updatedAt) }}</span>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <el-button
              :type="note.isLiked ? 'danger' : ''"
              :icon="Heart"
              circle
              @click="onToggleLike(note)"
            />
            <span class="text-sm text-gray-500 min-w-6 text-center">{{ note.likeCount }}</span>
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
