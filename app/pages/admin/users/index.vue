<script lang="ts" setup>
  import { Search } from 'lucide-vue-next'

  definePageMeta({ layout: 'default' })

  const { listUsers, updateUser, resetPassword } = useAdminApi()
  const authStore = useAuthStore()

  const loading = ref(false)
  const users = ref<any[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(10)
  const keyword = ref('')

  const formatDateTime = (value: string | null) => {
    if (!value) return '-'
    return new Date(value).toLocaleString()
  }

  const loadUsers = async () => {
    loading.value = true
    try {
      const res = await listUsers(page.value, pageSize.value, keyword.value || undefined)
      users.value = res.users
      total.value = res.total
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || '加载用户列表失败')
    } finally {
      loading.value = false
    }
  }

  const handleToggleActive = async (user: any) => {
    try {
      await updateUser(user.id, { isActive: !user.isActive })
      user.isActive = !user.isActive
      ElMessage.success(user.isActive ? '已启用用户' : '已禁用用户')
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || '操作失败')
    }
  }

  const handleRoleCommand = async (user: any, cmd: string) => {
    if (cmd === 'resetPassword') {
      try {
        await ElMessageBox.confirm(
          `确定要重置用户「${user.username || user.email}」的密码为 12345678 吗？`,
          '重置密码',
          { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
        )
        await resetPassword(user.id)
        ElMessage.success('密码已重置')
      } catch (error: any) {
        if (error === 'cancel') return
        ElMessage.error(error?.data?.statusMessage || '重置密码失败')
      }
    }
  }

  const handleSearch = () => {
    page.value = 1
    loadUsers()
  }

  const handlePageChange = (newPage: number) => {
    page.value = newPage
    loadUsers()
  }

  const handleSizeChange = (newSize: number) => {
    pageSize.value = newSize
    page.value = 1
    loadUsers()
  }

  onMounted(async () => {
    await authStore.initialize()
    await loadUsers()
  })
</script>

<template>
  <div class="max-w-5xl mx-auto px-3">
    <div class="flex items-center justify-between mt-2! mb-6!">
      <h1 class="font-bold text-2xl">用户管理</h1>
      <el-input
        v-model="keyword"
        style="width: 240px"
        placeholder="搜索邮箱或用户名"
        clearable
        :prefix-icon="Search"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
    </div>
    <div v-loading="loading" class="rounded-xl overflow-hidden border-2 border-gray-200 p-4 pt-2">
      <el-table :data="users" style="width: 100%" :row-style="{ height: '60px' }">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="username" label="用户名" min-width="120">
          <template #default="{ row }">
            {{ row.username || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-dropdown
              v-if="row.role !== 'ADMIN'"
              trigger="click"
              @command="(cmd: string) => handleRoleCommand(row, cmd)"
            >
              <el-tag type="info" class="cursor-pointer"> 用户 </el-tag>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="resetPassword">重置密码</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-tag v-else type="primary">管理员</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              :model-value="row.isActive"
              :disabled="row.role === 'ADMIN'"
              @change="handleToggleActive(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="noteCount" label="笔记数" width="80" />
        <el-table-column label="最后登录" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.lastLoginAt) }}
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
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
          class="my-2"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>
