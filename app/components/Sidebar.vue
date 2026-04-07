<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { ref } from 'vue'
  import {
    Plus,
    Delete,
    Star,
    Search,
    Document,
    Menu as IconMenu,
    Setting,
    Fold,
    Expand,
  } from '@element-plus/icons-vue'

  const isCollapse = ref(false)
  const fullscreenLoading = ref(false)
  const isDialogVisible = ref(false)
  const authMode = ref<'login' | 'register'>('login')
  const authLoading = ref(false)
  const authFormRef = ref<FormInstance>()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  const authForm = reactive({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  })
  const route = useRoute()
  const router = useRouter()

  const isLoginMode = computed(() => authMode.value === 'login')
  const authTitle = computed(() => (isLoginMode.value ? '登录' : '注册'))
  const authSubTitle = computed(() =>
    isLoginMode.value ? '登录以持久化保存笔记' : '使用邮箱创建新账号',
  )

  const activeIndex = computed(() => {
    const path = route.path
    if (path === '/') return '1'
    if (path.startsWith('/my-notes')) return '2'
    if (path.startsWith('/favourite')) return '3'
    if (path.startsWith('/recycle-bin')) return '4'
    if (path.startsWith('/settings')) return '5'
    return '1'
  })

  const toggleCollapse = () => {
    isCollapse.value = !isCollapse.value
  }

  const openLoginDialog = () => {
    authMode.value = 'login'
    isDialogVisible.value = true
  }

  const resetAuthForm = () => {
    authForm.email = ''
    authForm.password = ''
    authForm.confirmPassword = ''
    authForm.username = ''
  }

  const closeAuthDialog = () => {
    isDialogVisible.value = false
    authMode.value = 'login'
    authLoading.value = false
    resetAuthForm()
  }

  const authRules = computed<FormRules>(() => ({
    email: [
      {
        validator: (_rule, value: string, callback) => {
          const email = value?.trim()
          if (!email) return callback(new Error('请输入邮箱'))
          if (!emailRegex.test(email)) return callback(new Error('请输入合法的邮箱地址'))
          callback()
        },
        trigger: ['blur', 'change'],
      },
    ],
    password: [
      {
        validator: (_rule, value: string, callback) => {
          const password = value?.trim()
          if (!password) return callback(new Error('请输入密码'))
          if (!isLoginMode.value && password.length < 8) {
            return callback(new Error('密码至少需要8位'))
          }
          callback()
        },
        trigger: ['blur', 'change'],
      },
    ],
    confirmPassword: [
      {
        validator: (_rule, value: string, callback) => {
          if (isLoginMode.value) return callback()
          if (!value?.trim()) return callback(new Error('请再次输入密码'))
          if (value !== authForm.password) return callback(new Error('两次输入的密码不一致'))
          callback()
        },
        trigger: ['blur', 'change'],
      },
    ],
    username: [
      {
        validator: (_rule, value: string, callback) => {
          if (isLoginMode.value) return callback()
          const username = value?.trim()
          if (!username) return callback(new Error('请输入用户名'))
          if (!usernameRegex.test(username)) {
            return callback(new Error('用户名需为3-20位，仅支持字母、数字和下划线'))
          }
          callback()
        },
        trigger: ['blur', 'change'],
      },
    ],
  }))

  const validateAuthForm = async () => {
    const fields = isLoginMode.value
      ? ['email', 'password']
      : ['email', 'password', 'confirmPassword', 'username']
    try {
      await authFormRef.value?.validateField(fields)
      return true
    } catch {
      return false
    }
  }

  const submitLogin = async () => {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: authForm.email.trim(),
        password: authForm.password,
      },
    })
  }

  const submitRegister = async () => {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        email: authForm.email.trim(),
        password: authForm.password,
        username: authForm.username.trim(),
      },
    })
  }

  const validateUsernameOnBlur = () => {
    if (isLoginMode.value) return
    authFormRef.value?.validateField('username')
  }

  const handleAuthEnter = async () => {
    if (authLoading.value) return
    if (isLoginMode.value) {
      await handleLoginClick()
      return
    }
    await handleRegisterClick()
  }

  const handleLoginClick = async () => {
    if (!isLoginMode.value) {
      authMode.value = 'login'
      return
    }

    const passed = await validateAuthForm()
    if (!passed) return
    authLoading.value = true
    try {
      await submitLogin()
      ElMessage.success('登录成功')
      closeAuthDialog()
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '登录失败')
    } finally {
      authLoading.value = false
    }
  }

  const handleRegisterClick = async () => {
    if (isLoginMode.value) {
      authMode.value = 'register'
      return
    }

    const passed = await validateAuthForm()
    if (!passed) return
    authLoading.value = true
    try {
      await submitRegister()
      ElMessage.success('注册成功，已为你自动登录')
      closeAuthDialog()
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '注册失败')
    } finally {
      authLoading.value = false
    }
  }

  const handleCreateNote = () => {
    fullscreenLoading.value = true
    setTimeout(() => {
      fullscreenLoading.value = false
      router.push('/editor')
    }, 600)
  }
</script>

<template>
  <div
    class="sidebar-container relative h-screen bg-gray-100 transition-all duration-300 ease-in-out group"
    :style="{ width: isCollapse ? '64px' : '256px' }"
  >
    <div class="h-14 flex items-center justify-evenly overflow-hidden whitespace-nowrap">
      <span v-if="!isCollapse" class="font-bold text-gray-700 text-lg">Multimodal-Notes</span>
      <el-avatar
        :size="36"
        src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png"
        class="cursor-pointer"
        @click="openLoginDialog"
      />
    </div>
    <div class="flex justify-evenly my-2!">
      <el-input
        v-if="!isCollapse"
        readonly
        style="width: 180px; height: 36px"
        size="large"
        placeholder="搜索"
        class="el-border-radius rounded-input-12"
        :prefix-icon="Search"
      />
      <el-tooltip content="新建笔记" placement="bottom" effect="light">
        <el-button
          v-loading.fullscreen.lock="fullscreenLoading"
          type="default"
          :icon="Plus"
          class="el-border-radius p-2! w-9! h-9!"
          @click="handleCreateNote"
        />
      </el-tooltip>
    </div>

    <Dialog
      v-model="isDialogVisible"
      :title="''"
      :show-footer="false"
      :show-close="false"
      width="400px"
      :close-on-click-modal="true"
      :destroy-on-close="true"
      @closed="closeAuthDialog"
    >
      <template #header>
        <div class="auth-logo">{{ authTitle }}</div>
      </template>
      <template #default>
        <div class="auth-dialog">
          <div class="auth-subtitle">{{ authSubTitle }}</div>

          <el-form
            ref="authFormRef"
            :model="authForm"
            :rules="authRules"
            label-position="top"
            class="auth-form"
            @submit.prevent
          >
            <el-form-item prop="email">
              <el-input
                v-model="authForm.email"
                placeholder="请输入邮箱"
                size="large"
                class="rounded-input-12"
                @keyup.enter="handleAuthEnter"
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="authForm.password"
                type="password"
                show-password
                placeholder="请输入密码"
                size="large"
                class="rounded-input-12"
                @keyup.enter="handleAuthEnter"
              />
            </el-form-item>

            <template v-if="!isLoginMode">
              <el-form-item prop="confirmPassword">
                <el-input
                  v-model="authForm.confirmPassword"
                  type="password"
                  show-password
                  placeholder="请确认密码"
                  size="large"
                  class="rounded-input-12"
                  @keyup.enter="handleAuthEnter"
                />
              </el-form-item>

              <el-form-item prop="username">
                <el-input
                  v-model="authForm.username"
                  placeholder="请输入用户名（3-20位，字母数字下划线）"
                  size="large"
                  class="rounded-input-12"
                  @blur="validateUsernameOnBlur"
                  @keyup.enter="handleAuthEnter"
                />
              </el-form-item>
            </template>
          </el-form>

          <div class="auth-action-grid">
            <el-button
              size="large"
              class="auth-btn"
              :loading="authLoading"
              @click="handleLoginClick"
            >
              登录
            </el-button>
            <el-button
              size="large"
              type="primary"
              class="auth-btn"
              :loading="authLoading"
              @click="handleRegisterClick"
            >
              注册
            </el-button>
          </div>
        </div></template
      >
    </Dialog>

    <el-menu
      :default-active="activeIndex"
      class="el-menu-vertical bg-gray-100 h-full font-bold"
      :collapse="isCollapse"
      :collapse-transition="false"
    >
      <NuxtLink to="/">
        <el-menu-item index="1">
          <el-icon><icon-menu /></el-icon>
          <template #title>工作台</template>
        </el-menu-item>
      </NuxtLink>

      <NuxtLink to="/my-notes">
        <el-menu-item index="2">
          <el-icon><document /></el-icon>
          <template #title>我的笔记</template>
        </el-menu-item>
      </NuxtLink>

      <NuxtLink to="/favourite">
        <el-menu-item index="3">
          <el-icon><star /></el-icon>
          <template #title>我的收藏</template>
        </el-menu-item>
      </NuxtLink>

      <NuxtLink to="/recycle-bin">
        <el-menu-item index="4">
          <el-icon><delete /></el-icon>
          <template #title>回收站</template>
        </el-menu-item>
      </NuxtLink>

      <NuxtLink to="/settings">
        <el-menu-item index="5">
          <el-icon><setting /></el-icon>
          <template #title>应用设置</template>
        </el-menu-item>
      </NuxtLink>
    </el-menu>

    <div
      class="absolute top-1/2 -right-3 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    >
      <el-button
        circle
        size="small"
        class="shadow-md bg-white border-gray-100 hover:text-primary"
        @click="toggleCollapse"
      >
        <el-icon>
          <Expand v-if="isCollapse" />
          <Fold v-else />
        </el-icon>
      </el-button>
    </div>
  </div>
</template>

<style scoped>
  .el-menu-vertical {
    --el-menu-bg-color: #f3f4f6;
    --el-menu-border-color: transparent;
  }

  .el-menu-vertical:not(.el-menu--collapse) {
    width: 100%;
  }

  .el-border-radius {
    --el-border-radius-base: 8px;
  }

  .auth-dialog {
    padding: 8px 4px;
  }

  .auth-logo {
    text-align: center;
    font-size: 25px;
    font-weight: 700;
    color: #1f2937;
    letter-spacing: 2px;
    margin-top: 8px;
  }

  .auth-title {
    text-align: center;
    font-size: 22px;
    font-weight: 700;
    margin-top: 10px;
    color: #111827;
  }

  .auth-subtitle {
    text-align: center;
    font-size: 14px;
    color: #6b7280;
    margin-top: 6px;
  }

  .auth-form {
    margin-top: 16px !important;
  }

  .rounded-input-12 :deep(.el-input__wrapper) {
    border-radius: 12px !important;
  }

  .auth-action-grid {
    margin-top: 8px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .auth-btn {
    margin-left: 0;
    border-radius: 10px;
    height: 44px;
  }

  @media (max-width: 640px) {
    .auth-action-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
