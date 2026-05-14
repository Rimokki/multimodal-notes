<script lang="ts" setup>
  import { Trash2 } from 'lucide-vue-next'

  definePageMeta({ layout: 'default' })

  const { createBroadcast, listAllNotifications, deleteNotification } = useNotificationApi()
  const authStore = useAuthStore()

  const isPublishDialogVisible = ref(false)
  const publishLoading = ref(false)
  const publishForm = reactive({ title: '', content: '' })

  const { ready, wait } = useMinimumDelay(500)
  const notifications = ref<any[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)

  const handlePublish = async () => {
    if (!publishForm.title.trim()) return ElMessage.warning('请输入标题')
    if (!publishForm.content.trim()) return ElMessage.warning('请输入内容')
    publishLoading.value = true
    try {
      await createBroadcast(publishForm.title.trim(), publishForm.content.trim())
      ElMessage.success('通知已发布')
      isPublishDialogVisible.value = false
      publishForm.title = ''
      publishForm.content = ''
      await loadNotifications()
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || '发布失败')
    } finally {
      publishLoading.value = false
    }
  }

  const loadNotifications = async () => {
    try {
      const res = await wait(listAllNotifications(page.value, pageSize.value))
      notifications.value = res.notifications
      total.value = res.total
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || '加载通知列表失败')
    }
  }

  const handleDelete = async (id: number, title: string) => {
    try {
      await ElMessageBox.confirm(`确定要删除通知「${title}」吗？删除后不可恢复。`, '删除确认', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      })
      await deleteNotification(id)
      ElMessage.success('通知已删除')
      await loadNotifications()
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error?.data?.statusMessage || '删除失败')
      }
    }
  }

  const handlePageChange = (newPage: number) => {
    page.value = newPage
    loadNotifications()
  }

  const handleSizeChange = (newSize: number) => {
    pageSize.value = newSize
    page.value = 1
    loadNotifications()
  }

  onMounted(async () => {
    await loadNotifications()
  })
</script>

<template>
  <div class="max-w-5xl mx-auto px-3">
    <div class="flex items-center justify-between mt-2! mb-6!">
      <h1 class="font-bold text-2xl">通知管理</h1>
      <el-button type="primary" @click="isPublishDialogVisible = true"> 发布通知 </el-button>
    </div>

    <div class="rounded-xl overflow-hidden border-2 border-gray-200 p-4 pt-2">
      <template v-if="!ready">
        <el-skeleton :rows="0" animated>
          <template #template>
            <div v-for="i in 5" :key="i" class="flex items-center" style="height: 60px">
              <div style="width: 60px">
                <el-skeleton-item variant="text" style="width: 30px; height: 16px" />
              </div>
              <div style="min-width: 200px">
                <el-skeleton-item variant="text" style="width: 70%; height: 16px" />
              </div>
              <div style="min-width: 300px; flex: 1">
                <el-skeleton-item variant="text" style="width: 90%; height: 16px" />
              </div>
              <div style="width: 140px">
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
        <el-table :data="notifications" style="width: 100%" :row-style="{ height: '60px' }">
          <el-table-column label="ID" width="60" prop="id" />
          <el-table-column label="标题" min-width="200">
            <template #default="{ row }">
              <span class="font-medium">{{ row.title }}</span>
            </template>
          </el-table-column>
          <el-table-column label="内容" min-width="300">
            <template #default="{ row }">
              <span class="text-gray-600 text-sm line-clamp-2">{{ row.content }}</span>
            </template>
          </el-table-column>
          <el-table-column label="发布者" width="140">
            <template #default="{ row }">
              <span class="text-gray-600">{{ row.sender?.username || '系统' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="发布时间" width="170">
            <template #default="{ row }">
              <span class="text-gray-600">{{ new Date(row.createdAt).toLocaleString() }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button
                type="danger"
                :icon="Trash2"
                circle
                @click="handleDelete(row.id, row.title)"
              >
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="notifications.length === 0" description="暂无通知" />
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

    <Dialog
      v-model="isPublishDialogVisible"
      title="发布全站通知"
      width="500px"
      :confirm-loading="publishLoading"
      @confirm="handlePublish"
    >
      <el-form :model="publishForm" label-position="top" class="mt-2">
        <el-form-item label="标题" required>
          <el-input
            v-model="publishForm.title"
            placeholder="输入通知标题"
            maxlength="60"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input
            v-model="publishForm.content"
            type="textarea"
            resize="none"
            :rows="4"
            placeholder="输入通知内容"
            maxlength="1000"
            show-word-limit
            :input-style="{ height: '240px' }"
          />
        </el-form-item>
      </el-form>
    </Dialog>
  </div>
</template>
