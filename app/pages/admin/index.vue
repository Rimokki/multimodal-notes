<script lang="ts" setup>
  import { Users, FileText, UserCheck, UserPlus } from 'lucide-vue-next'
  import * as echarts from 'echarts'

  definePageMeta({ layout: 'default' })

  const { getStats } = useAdminApi()
  const authStore = useAuthStore()

  const loading = ref(false)
  const stats = ref({
    totalUsers: 0,
    totalNotes: 0,
    activeUsers: 0,
    recentUsers: 0,
    dates: [] as string[],
    userTrend: [] as number[],
    noteTrend: [] as number[],
  })

  const userChartRef = ref<HTMLElement>()
  const noteChartRef = ref<HTMLElement>()
  let userChart: echarts.ECharts | null = null
  let noteChart: echarts.ECharts | null = null

  const makeLineOption = (title: string, dates: string[], data: number[], color: string) => ({
    title: { text: title, left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' as const },
    grid: { left: 48, right: 24, top: 48, bottom: 24 },
    xAxis: { type: 'category' as const, data: dates, boundaryGap: false },
    yAxis: { type: 'value' as const, minInterval: 1 },
    series: [
      {
        type: 'line' as const,
        data,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color },
        itemStyle: { color },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: color + '40' },
            { offset: 1, color: color + '05' },
          ]),
        },
      },
    ],
  })

  const renderCharts = () => {
    if (userChartRef.value && stats.value.dates.length) {
      userChart?.dispose()
      userChart = echarts.init(userChartRef.value)
      userChart.setOption(
        makeLineOption('近7天用户增长', stats.value.dates, stats.value.userTrend, '#3b82f6'),
      )
    }
    if (noteChartRef.value && stats.value.dates.length) {
      noteChart?.dispose()
      noteChart = echarts.init(noteChartRef.value)
      noteChart.setOption(
        makeLineOption('近7天笔记增长', stats.value.dates, stats.value.noteTrend, '#22c55e'),
      )
    }
  }

  const handleResize = () => {
    userChart?.resize()
    noteChart?.resize()
  }

  const loadStats = async () => {
    loading.value = true
    try {
      stats.value = await getStats()
      nextTick(renderCharts)
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || '加载统计数据失败')
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    await authStore.initialize()
    await loadStats()
    window.addEventListener('resize', handleResize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    userChart?.dispose()
    noteChart?.dispose()
  })
</script>

<template>
  <div class="max-w-5xl mx-auto px-3">
    <div class="flex items-center justify-between mt-2! mb-6!">
      <h1 class="font-bold text-2xl">管理总览</h1>
      <span class="text-sm text-gray-400">{{ authStore.accountName }}</span>
    </div>
    <div v-loading="loading" class="grid grid-cols-4 gap-4">
      <el-card shadow="hover">
        <div class="flex items-center gap-3 py-1">
          <Users :size="28" class="text-blue-500" />
          <div>
            <div class="text-sm text-gray-500">用户总数</div>
            <div class="text-2xl font-bold">{{ stats.totalUsers }}</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="flex items-center gap-3 py-1">
          <FileText :size="28" class="text-green-500" />
          <div>
            <div class="text-sm text-gray-500">笔记总数</div>
            <div class="text-2xl font-bold">{{ stats.totalNotes }}</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="flex items-center gap-3 py-1">
          <UserCheck :size="28" class="text-orange-500" />
          <div>
            <div class="text-sm text-gray-500">近期活跃用户</div>
            <div class="text-2xl font-bold">{{ stats.activeUsers }}</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="flex items-center gap-3 py-1">
          <UserPlus :size="28" class="text-purple-500" />
          <div>
            <div class="text-sm text-gray-500">近期新增用户</div>
            <div class="text-2xl font-bold">{{ stats.recentUsers }}</div>
          </div>
        </div>
      </el-card>
    </div>
    <div class="grid grid-cols-2 gap-4 mt-6">
      <el-card shadow="hover">
        <div ref="userChartRef" class="h-72"></div>
      </el-card>
      <el-card shadow="hover">
        <div ref="noteChartRef" class="h-72"></div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
  .el-card {
    border-radius: 12px !important;
    border: 2px solid #e5e7eb !important;
  }
</style>
