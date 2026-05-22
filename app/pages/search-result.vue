<script lang="ts" setup>
  import { Search, Notebook } from 'lucide-vue-next'
  import type { NoteItem } from '~/composables/useNotesApi'

  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const { listNotes } = useNotesApi()
  const { listCommunityNotes } = useCommunityApi()

  const searchResults = ref<NoteItem[]>([])
  const totalResults = ref(0)
  const queryParam = (route.query.query as string) || ''
  const searchInput = ref(queryParam)
  const searchScope = ref<'my' | 'public'>((route.query.scope as 'my' | 'public') || 'my')

  const formatDateTime = (value: string | null) => {
    if (!value) {
      return '-'
    }

    return new Date(value).toLocaleString()
  }

  const toRowTitle = (note: NoteItem) => {
    return note.title?.trim() || '无标题笔记'
  }

  const toRowSummaryText = (note: NoteItem) => {
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

  const escapeRegExp = (value: string) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  const buildSummarySnippet = (text: string, keyword: string) => {
    const normalizedText = text.replace(/\s+/g, ' ').trim()
    if (!normalizedText) {
      return '暂无摘要'
    }

    const normalizedKeyword = keyword.trim()
    if (!normalizedKeyword) {
      return normalizedText.length > 80 ? `${normalizedText.slice(0, 80)}...` : normalizedText
    }

    const lowerText = normalizedText.toLocaleLowerCase()
    const lowerKeyword = normalizedKeyword.toLocaleLowerCase()
    const hitIndex = lowerText.indexOf(lowerKeyword)

    if (hitIndex < 0) {
      return normalizedText.length > 80 ? `${normalizedText.slice(0, 80)}...` : normalizedText
    }

    const radius = 35
    const start = Math.max(0, hitIndex - radius)
    const end = Math.min(normalizedText.length, hitIndex + normalizedKeyword.length + radius)
    const prefix = start > 0 ? '...' : ''
    const suffix = end < normalizedText.length ? '...' : ''

    return `${prefix}${normalizedText.slice(start, end)}${suffix}`
  }

  const splitByKeyword = (text: string, keyword: string) => {
    const normalizedKeyword = keyword.trim()
    if (!normalizedKeyword) {
      return [{ text, highlighted: false }]
    }

    const keywordPattern = new RegExp(`(${escapeRegExp(normalizedKeyword)})`, 'gi')
    return text
      .split(keywordPattern)
      .filter(Boolean)
      .map((part) => ({
        text: part,
        highlighted: part.toLocaleLowerCase() === normalizedKeyword.toLocaleLowerCase(),
      }))
  }

  const buildTitleSnippet = (note: NoteItem, keyword: string) => {
    return buildSummarySnippet(toRowTitle(note), keyword)
  }

  const toRowTitleParts = (note: NoteItem) => {
    return splitByKeyword(toRowTitle(note), searchInput.value)
  }

  const toRowSummaryParts = (note: NoteItem) => {
    const keyword = searchInput.value.trim()
    const summaryText = toRowSummaryText(note)
    const summarySnippet = buildSummarySnippet(summaryText, keyword)
    const hasSummaryHit = keyword
      ? summaryText.toLocaleLowerCase().includes(keyword.toLocaleLowerCase())
      : false
    const snippet = hasSummaryHit ? summarySnippet : buildTitleSnippet(note, keyword)

    return splitByKeyword(snippet, keyword)
  }

  const openNote = async (noteId: number) => {
    await router.push(`/editor?id=${noteId}`)
  }

  const performSearch = async () => {
    if (!authStore.isLoggedIn) {
      ElMessage.warning('请先登录后搜索笔记')
      return
    }

    try {
      if (searchScope.value === 'my') {
        const searchResponse = await listNotes('all', searchInput.value, 1, 10)
        searchResults.value = searchResponse.notes
        totalResults.value = searchResponse.total
      } else {
        const searchResponse = await listCommunityNotes(searchInput.value, 1, 10)
        searchResults.value = searchResponse.notes as any
        totalResults.value = searchResponse.total
      }
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '搜索失败')
    }
  }

  const onScopeChange = () => {
    if (searchInput.value.trim()) {
      performSearch()
    }
  }

  onMounted(() => {
    if (queryParam) {
      performSearch()
    }
  })
</script>

<template>
  <div class="wrapper flex-col mx-6!">
    <div class="flex items-center gap-5 mb-4">
      <el-input
        v-model="searchInput"
        class="search-input"
        clearable
        size="large"
        :prefix-icon="Search"
        placeholder="搜索"
        style="width: 25vw !important; min-width: 240px; height: 36px"
        @keyup.enter="performSearch"
      />

      <div class="custom-segmented">
        <el-segmented
          v-model="searchScope"
          :options="[
            { label: '我的笔记', value: 'my' },
            { label: '公开笔记', value: 'public' },
          ]"
          size="large"
          @change="onScopeChange"
        />
      </div>
    </div>

    <el-alert
      v-if="!authStore.isLoggedIn"
      type="warning"
      :closable="false"
      show-icon
      class="mt-6! font-bold"
    >
      请先登录后搜索笔记
    </el-alert>

    <div v-else>
      <div class="font-medium text-gray-400 my-4">搜索到 {{ totalResults }} 条结果</div>
      <el-table
        v-if="searchResults.length"
        :data="searchResults"
        style="width: 100%"
        :show-header="false"
        :row-style="{ height: '80px' }"
        class="font-semibold"
      >
        <el-table-column label="标题" min-width="100">
          <template #default="{ row }">
            <span
              class="flex w-full min-w-0 items-center gap-1 cursor-pointer text-gray-700 hover:text-green-400"
              @click="openNote(row.id)"
            >
              <Notebook :size="20" class="shrink-0" />
              <span class="min-w-0 truncate">
                <template
                  v-for="(part, index) in toRowTitleParts(row)"
                  :key="`${row.id}-title-${index}`"
                >
                  <span :class="part.highlighted ? 'text-red-500' : ''">{{ part.text }}</span>
                </template>
              </span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="摘要" min-width="260">
          <template #default="{ row }">
            <span class="block text-gray-500 truncate">
              <template v-for="(part, index) in toRowSummaryParts(row)" :key="`${row.id}-${index}`">
                <span :class="part.highlighted ? 'text-red-500' : ''">{{ part.text }}</span>
              </template>
            </span>
          </template>
        </el-table-column>
        <el-table-column v-if="searchScope === 'public'" label="作者" width="160">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-avatar
                :src="(row as any).owner?.avatarUrl || '/images/original_avatar.png'"
                :size="20"
              />
              <span class="text-gray-600">{{ (row as any).owner?.username || '未知用户' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="220" align="right">
          <template #default="{ row }"> 更新于 {{ formatDateTime(row.updatedAt) }} </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无搜索结果" />
    </div>
  </div>
</template>

<style scoped>
  .search-input :deep(.el-input__wrapper) {
    border-radius: 8px;
  }

  .custom-segmented .el-segmented {
    font-weight: 600;
    --el-border-radius-base: 8px;
  }
</style>
