<script lang="ts" setup>
  import { Clock, Monitor, MapPin, CircleCheck, CircleX, ShieldX } from 'lucide-vue-next'

  definePageMeta({ layout: 'default' })

  const { listSessions } = useAdminApi()

  const { ready, wait } = useMinimumDelay(500)
  const sessions = ref<any[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)

  const formatDateTime = (value: string | null) => {
    if (!value) return '-'
    return new Date(value).toLocaleString()
  }

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return '未知设备'
    if (ua.includes('Windows')) return 'Windows'
    if (ua.includes('Mac OS')) return 'macOS'
    if (ua.includes('Linux')) return 'Linux'
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
    return '其他设备'
  }

  const getStatusInfo = (session: any) => {
    if (session.isRevoked) return { type: 'info' as const, text: '已登出', icon: ShieldX }
    if (session.isExpired) return { type: 'warning' as const, text: '已过期', icon: CircleX }
    return { type: 'success' as const, text: '在线', icon: CircleCheck }
  }

  const loadSessions = async () => {
    try {
      const res = await wait(listSessions(page.value, pageSize.value))
      sessions.value = res.sessions
      total.value = res.total
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || '加载登录日志失败')
    }
  }

  const handlePageChange = (newPage: number) => {
    page.value = newPage
    loadSessions()
  }

  const handleSizeChange = (newSize: number) => {
    pageSize.value = newSize
    page.value = 1
    loadSessions()
  }

  onMounted(async () => {
    await loadSessions()
  })
</script>

<template>
  <div class="max-w-5xl mx-auto px-3">
    <div class="flex items-center justify-between mt-2! mb-6!">
      <h1 class="font-bold text-2xl">登录日志</h1>
      <span class="text-sm text-gray-400">共 {{ total }} 条记录</span>
    </div>
    <div class="rounded-xl overflow-hidden border-2 border-gray-200 p-4 pt-2">
      <template v-if="!ready">
        <el-skeleton :rows="0" animated>
          <template #template>
            <div v-for="i in 5" :key="i" class="flex items-center" style="height: 60px">
              <div style="width: 60px">
                <el-skeleton-item variant="text" style="width: 30px; height: 16px" />
              </div>
              <div style="min-width: 360px; flex: 1">
                <el-skeleton-item variant="text" style="width: 70%; height: 16px" />
              </div>
              <div style="min-width: 120px">
                <el-skeleton-item variant="text" style="width: 50%; height: 16px" />
              </div>
              <div style="width: 80px">
                <el-skeleton-item variant="text" style="width: 30px; height: 16px" />
              </div>
              <div style="width: 170px">
                <el-skeleton-item variant="text" style="width: 70%; height: 16px" />
              </div>
              <div style="width: 170px">
                <el-skeleton-item variant="text" style="width: 70%; height: 16px" />
              </div>
            </div>
          </template>
        </el-skeleton>
      </template>
      <template v-else>
        <el-table :data="sessions" style="width: 100%" :row-style="{ height: '60px' }">
          <el-table-column label="用户" min-width="160">
            <template #default="{ row }">
              <div class="flex flex-col">
                <span class="font-medium">{{
                  row.user?.username || row.user?.email || '未知用户'
                }}</span>
                <span class="text-xs text-gray-400">{{ row.user?.email }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="getStatusInfo(row).type" size="small">
                {{ getStatusInfo(row).text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="设备" width="100">
            <template #default="{ row }">
              <div class="flex items-center gap-1 text-gray-600">
                <Monitor :size="14" />
                <span>{{ parseUserAgent(row.userAgent) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="IP 地址" width="130">
            <template #default="{ row }">
              <div class="flex items-center gap-1 text-gray-600">
                <MapPin :size="14" />
                <span>{{ row.ipAddress || '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="登录时间" width="170">
            <template #default="{ row }">
              <div class="flex items-center gap-1 text-gray-600">
                <Clock :size="14" />
                <span>{{ formatDateTime(row.createdAt) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="过期时间" width="170">
            <template #default="{ row }">
              {{ formatDateTime(row.expiresAt) }}
            </template>
          </el-table-column>
        </el-table>
      </template>
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          class="my-2"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>
