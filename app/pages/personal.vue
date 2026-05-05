<script lang="ts" setup>
  import { ElMessage } from 'element-plus'
  const authStore = useAuthStore()
  const defaultAvatarUrl = '/images/original-avatar.png'
  const changingPasswordVisible = ref(false)
  const changingPasswordLoading = ref(false)
  const updateProfileLoading = ref(false)
  const avatarUploadLoading = ref(false)
  const usernameInput = ref('')
  const avatarFileInputRef = ref<HTMLInputElement | null>(null)

  type UpdateProfileResponse = {
    user: {
      id: number
      email: string
      username: string | null
      avatarUrl: string | null
      isActive: boolean
      lastLoginAt: string | null
      createdAt: string
      updatedAt: string
    }
  }

  type UploadableFile = {
    name: string
    size: number
    type: string
    lastModified: number
    content: string
  }

  const passwordFormRef = ref()
  const passwordForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const userAvatar = computed(() => authStore.user?.avatarUrl || defaultAvatarUrl)
  const userEmail = computed(() => {
    return authStore.user?.email || '无邮箱'
  })

  watch(
    () => authStore.user,
    (user) => {
      usernameInput.value = user?.username || ''
    },
    { immediate: true },
  )

  const readFileAsDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
          return
        }

        reject(new Error('文件读取失败'))
      }

      reader.onerror = () => {
        reject(reader.error || new Error('文件读取失败'))
      }

      reader.readAsDataURL(file)
    })
  }

  const serializeFileToPayload = async (file: File): Promise<UploadableFile> => {
    const content = await readFileAsDataUrl(file)

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      content,
    }
  }

  const triggerAvatarSelect = () => {
    if (avatarUploadLoading.value) {
      return
    }

    avatarFileInputRef.value?.click()
  }

  const handleAvatarFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (!file) {
      return
    }

    if (!authStore.accessToken) {
      ElMessage.error('请先登录')
      input.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      ElMessage.error('仅支持上传图片文件')
      input.value = ''
      return
    }

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      ElMessage.error('头像图片大小不能超过2MB')
      input.value = ''
      return
    }

    try {
      avatarUploadLoading.value = true
      const payloadFile = await serializeFileToPayload(file)
      const { request } = useApiFetch()
      const response = await request<UpdateProfileResponse>('/api/auth/avatar', {
        method: 'POST',
        body: {
          file: payloadFile,
        },
      })

      authStore.user = response.user
      ElMessage.success('头像更新成功')
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || '头像上传失败')
    } finally {
      avatarUploadLoading.value = false
      input.value = ''
    }
  }

  const handleUpdateProfile = async () => {
    if (!authStore.accessToken) {
      ElMessage.error('请先登录')
      return
    }

    const normalizedUsername = usernameInput.value.trim()
    const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernamePattern.test(normalizedUsername)) {
      ElMessage.error('用户名需为 3-20 位，仅支持字母、数字和下划线')
      return
    }

    if (normalizedUsername === (authStore.user?.username || '')) {
      ElMessage.info('用户名未修改')
      return
    }

    try {
      updateProfileLoading.value = true

      const { request } = useApiFetch()
      const response = await request<UpdateProfileResponse>('/api/auth/update', {
        method: 'PUT',
        body: {
          username: normalizedUsername,
        },
      })

      authStore.user = response.user
      usernameInput.value = response.user.username || ''
      ElMessage.success('用户名更新成功')
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || '用户名更新失败')
    } finally {
      updateProfileLoading.value = false
    }
  }

  const passwordRules = {
    oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 8, message: '密码长度至少 8 位', trigger: 'blur' },
    ],
    confirmPassword: [
      { required: true, message: '请确认新密码', trigger: 'blur' },
      {
        validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
          if (value !== passwordForm.newPassword) {
            callback(new Error('两次输入的新密码不一致'))
            return
          }

          callback()
        },
        trigger: 'blur',
      },
    ],
  }

  const resetPasswordForm = () => {
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    passwordFormRef.value?.clearValidate?.()
  }

  const handleOpenChangePassword = () => {
    resetPasswordForm()
    changingPasswordVisible.value = true
  }

  const handleChangePassword = async () => {
    if (!authStore.accessToken) {
      ElMessage.error('请先登录')
      return
    }

    await passwordFormRef.value?.validate?.()

    try {
      changingPasswordLoading.value = true

      const { request } = useApiFetch()
      await request('/api/auth/update', {
        method: 'PUT',
        body: {
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        },
      })

      try {
        await $fetch('/api/auth/logout', {
          method: 'POST',
        })
      } catch {
        // 即使登出接口调用失败，也继续清除本地会话，强制用户重新登录
      } finally {
        authStore.clearSession()
      }

      ElMessage.success('密码修改成功，请重新登录')
      changingPasswordVisible.value = false
      resetPasswordForm()
      await navigateTo('/')
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || '修改密码失败')
    } finally {
      changingPasswordLoading.value = false
    }
  }
  // const registerTime = computed(() => {
  //   if (!authStore.user?.createdAt) {
  //     return '未知注册时间'
  //   }
  //   return new Date(authStore.user.createdAt).toLocaleString()
  // })
</script>

<template>
  <div class="max-w-5xl mx-auto px-3">
    <h1 class="font-bold text-2xl mt-2! mb-4!">个人中心</h1>

    <div class="flex flex-col justify-around text-xl font-medium text-gray-500">
      <h4 class="text-base text-gray-400 mb-2">头像</h4>
      <div class="flex items-center gap-4 mb-4">
        <el-avatar :size="110" :src="userAvatar" />
        <div class="flex flex-col gap-2 ml-1">
          <el-button
            type="default"
            size="small"
            :loading="avatarUploadLoading"
            style="width: 100px"
            @click="triggerAvatarSelect"
            >上传头像</el-button
          >
          <input
            ref="avatarFileInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleAvatarFileChange"
          />
          <span class="text-sm">头像图片的大小需要小于2MB</span>
        </div>
      </div>
      <h4 class="text-base text-gray-400 mb-2">用户名</h4>
      <div class="flex items-center gap-4 mb-4">
        <div class="flex flex-col gap-2 ml-2">
          <el-input
            v-model="usernameInput"
            maxlength="20"
            show-word-limit
            style="width: 20vw; height: 36px"
          />
        </div>
      </div>
      <h4 class="text-base text-gray-400 mb-2">邮箱</h4>
      <div class="flex items-center gap-4 mb-4">
        <div class="flex flex-col gap-2 ml-2">
          <el-input :model-value="userEmail" disabled style="width: 20vw; height: 36px" />
        </div>
      </div>
    </div>

    <div>
      <el-button
        type="primary"
        class="mt-4"
        :loading="updateProfileLoading"
        @click="handleUpdateProfile"
        >更新个人信息</el-button
      >
      <el-button type="danger" class="mt-4" @click="handleOpenChangePassword">修改密码</el-button>
      <el-button type="default" class="mt-4" @click="$router.back">返回</el-button>
    </div>

    <el-dialog
      v-model="changingPasswordVisible"
      title="修改密码"
      width="460px"
      :close-on-click-modal="false"
      class="font-semibold"
      @closed="resetPasswordForm"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="90px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            show-password
            autocomplete="current-password"
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end">
          <el-button @click="changingPasswordVisible = false">取消</el-button>
          <el-button type="primary" :loading="changingPasswordLoading" @click="handleChangePassword"
            >确认修改</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>
