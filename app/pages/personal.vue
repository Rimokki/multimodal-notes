<script lang="ts" setup>
  const authStore = useAuthStore()
  const defaultAvatarUrl = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'

  const userAvatar = computed(() => authStore.user?.avatarUrl || defaultAvatarUrl)
  const username = computed(() => {
    return authStore.user?.displayName || authStore.user?.username || '未命名用户'
  })
  const userEmail = computed(() => {
    return authStore.user?.email || '无邮箱'
  })
  const registerTime = computed(() => {
    if (!authStore.user?.createdAt) {
      return '未知注册时间'
    }
    return new Date(authStore.user.createdAt).toLocaleString()
  })
  const lastLoginTime = computed(() => {
    if (!authStore.user?.lastLoginAt) {
      return '未知登录时间'
    }
    return new Date(authStore.user.lastLoginAt).toLocaleString()
  })
</script>

<template>
  <div class="max-w-5xl mx-auto px-3">
    <h1 class="font-bold text-2xl mt-2! mb-4!">个人中心</h1>
    <!-- <div class="flex">
      <el-avatar :size="100" :src="userAvatar" />
      <div class="flex flex-col justify-around text-xl font-medium ml-6 text-gray-500">
        <div>{{ username }}</div>
        <div>{{ userEmail }}</div>
        <div>注册于{{ registerTime }}</div>
      </div>
    </div> -->
    <el-descriptions direction="vertical" size="large" border style="margin-top: 20px">
      <el-descriptions-item :rowspan="2" :width="140" label="头像" align="center">
        <el-image style="width: 120px; height: 120px; border-radius: 12px" :src="userAvatar" />
      </el-descriptions-item>
      <el-descriptions-item label="用户名">{{ username }}</el-descriptions-item>
      <el-descriptions-item label="邮箱">{{ userEmail }}</el-descriptions-item>
      <el-descriptions-item label="注册时间">{{ registerTime }}</el-descriptions-item>
      <el-descriptions-item label="最近登录">{{ lastLoginTime }}</el-descriptions-item>
    </el-descriptions>
    <div>
      <el-button type="primary" class="mt-4" @click="$router.push('/personal/edit')"
        >编辑个人信息</el-button
      >
    </div>
  </div>
</template>

<style lang="css" scoped></style>
