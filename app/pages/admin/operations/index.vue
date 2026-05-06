<script lang="ts" setup>
  import { Clock } from 'lucide-vue-next'

  definePageMeta({ layout: 'default' })

  const { listLogs } = useAdminApi()
  const authStore = useAuthStore()

  const loading = ref(false)
  const logs = ref<any[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const keyword = ref('')
  const actionFilter = ref('')

  const actionOptions = [
    { label: '全部操作', value: '' },
    { label: '修改用户', value: 'USER_UPDATE' },
    { label: '删除笔记', value: 'NOTE_DELETE' },
    { label: '重置密码', value: 'PASSWORD_RESET' },
  ]

  const actionTagMap: Record<
    string,
    { label: string; type: 'warning' | 'danger' | 'info' | 'success' }
  > = {
    USER_UPDATE: { label: '修改用户', type: 'warning' },
    NOTE_DELETE: { label: '删除笔记', type: 'danger' },
    PASSWORD_RESET: { label: '重置密码', type: 'warning' },
  }

  const formatDateTime = (value: string | null) => {
    if (!value) return '-'
    return new Date(value).toLocaleString()
  }

  const formatDetail = (action: string, detail: string | null) => {
    if (!detail) return '-'
    try {
      const obj = JSON.parse(detail)
      if (action === 'USER_UPDATE') {
        const target = obj.target || '未知用户'
        const changes = (obj.changes as string[]) || []
        return `修改用户「${target}」: ${changes.join('; ') || '无变更'}`
      }
      if (action === 'NOTE_DELETE') {
        const title = obj.title || '无标题'
        const owner = obj.owner || '未知'
        return `删除笔记「${title}」(作者: ${owner})`
      }
      if (action === 'PASSWORD_RESET') {
        const target = obj.target || '未知用户'
        return `重置用户「${target}」的密码`
      }
      return Object.entries(obj)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
    } catch {
      return detail
    }
  }

  const loadLogs = async () => {
    loading.value = true
    try {
      const res = await listLogs(
        page.value,
        pageSize.value,
        keyword.value || undefined,
        actionFilter.value || undefined,
      )
      logs.value = res.logs
      total.value = res.total
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || '加载操作日志失败')
    } finally {
      loading.value = false
    }
  }

  const handleSearch = () => {
    page.value = 1
    loadLogs()
  }

  const handleFilterChange = () => {
    page.value = 1
    loadLogs()
  }

  const handlePageChange = (newPage: number) => {
    page.value = newPage
    loadLogs()
  }

  const handleSizeChange = (newSize: number) => {
    pageSize.value = newSize
    page.value = 1
    loadLogs()
  }

  onMounted(async () => {
    await authStore.initialize()
    await loadLogs()
  })
</script>

<template>
  <div class="max-w-5xl mx-auto px-3">
    <div class="flex items-center justify-between mt-2! mb-6!">
      <h1 class="font-bold text-2xl">操作日志</h1>
      <span class="text-sm text-gray-400">共 {{ total }} 条记录</span>
    </div>

    <div class="flex gap-3 mb-4">
      <el-input
        v-model="keyword"
        placeholder="搜索管理员邮箱或用户名"
        clearable
        style="width: 280px"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
      <el-select
        v-model="actionFilter"
        placeholder="操作类型"
        clearable
        style="width: 160px"
        @change="handleFilterChange"
      >
        <el-option
          v-for="opt in actionOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </div>

    <div v-loading="loading" class="rounded-xl overflow-hidden border-2 border-gray-200 p-4 pt-2">
      <el-table :data="logs" style="width: 100%" :row-style="{ height: '60px' }">
        <el-table-column label="ID" width="60" prop="id" />
        <el-table-column label="操作者" min-width="160">
          <template #default="{ row }">
            <div class="flex flex-col">
              <span class="font-medium">{{
                row.admin?.username || row.admin?.email || '未知'
              }}</span>
              <span class="text-xs text-gray-400">{{ row.admin?.email }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作类型" width="120">
          <template #default="{ row }">
            <el-tag :type="actionTagMap[row.action]?.type || 'info'" size="small">
              {{ actionTagMap[row.action]?.label || row.action }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="目标 ID" width="90" prop="targetId">
          <template #default="{ row }">
            <span>{{ row.targetId ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作详情" min-width="360">
          <template #default="{ row }">
            <span class="text-gray-600 text-sm">{{ formatDetail(row.action, row.detail) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作时间" width="170">
          <template #default="{ row }">
            <div class="flex items-center gap-1 text-gray-600">
              <Clock :size="14" />
              <span>{{ formatDateTime(row.createdAt) }}</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          class="mb-4 mr-2"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>
