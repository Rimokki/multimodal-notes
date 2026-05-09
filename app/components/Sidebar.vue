<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { ref } from 'vue'
  import {
    LogIn,
    LogOut,
    User,
    Bell,
    Trash2,
    Plus,
    Star,
    Search,
    Notebook,
    Layers2,
    ChevronFirst,
    ChevronLast,
    Loader,
    Presentation,
    Clock,
    ClipboardList,
    MessageCircleQuestionMark,
  } from 'lucide-vue-next'

  type AuthResponse = {
    user: {
      id: number
      email: string
      username: string | null
      avatarUrl: string | null
      isActive: boolean
      role: string
      lastLoginAt: string | null
      createdAt: string
      updatedAt: string
    }
    accessToken: string
    accessTokenExpiresInSec: number
  }

  const isCollapse = ref(false)
  const fullscreenLoading = ref(false)
  const isDialogVisible = ref(false)
  const isNotificationVisible = ref(false)
  const isNotificationDetailVisible = ref(false)
  const selectedNotification = ref<any>(null)
  const notificationStatus = ref('全部')
  const notificationList = ref<any[]>([])
  const notificationLoading = ref(false)
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
  const authStore = useAuthStore()
  const notificationStore = useNotificationStore()
  const { createNote } = useNotesApi()
  const { listNotifications } = useNotificationApi()

  const defaultAvatarUrl = '/images/original_avatar.png'

  const userAvatar = computed(() => authStore.user?.avatarUrl || defaultAvatarUrl)
  const menuDisplayName = computed(() => {
    return authStore.user?.username || authStore.user?.email || '未命名用户'
  })
  const menuSubLabel = computed(() => {
    return authStore.user?.email || '普通用户'
  })

  const isLoginMode = computed(() => authMode.value === 'login')
  const authTitle = computed(() => (isLoginMode.value ? '登录' : '注册'))
  const authSubTitle = computed(() =>
    isLoginMode.value ? '登录以持久化保存笔记' : '使用邮箱创建新账号',
  )

  const searchQuery = ref('')

  const menuRouteMap: Record<string, string> = {
    '/': '1',
    '/my-notes': '2',
    '/favourite': '3',
    '/recycle-bin': '4',
    '/about': '5',
    '/admin': '6',
    '/admin/users': '7',
    '/admin/notes': '8',
    '/admin/notifications': '9',
    '/admin/sessions': '10',
    '/admin/operations': '11',
  }

  const activeIndex = computed(() => {
    return menuRouteMap[route.path] || ''
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
    return await $fetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: {
        email: authForm.email.trim(),
        password: authForm.password,
      },
    })
  }

  const submitRegister = async () => {
    return await $fetch<AuthResponse>('/api/auth/register', {
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
      const response = await submitLogin()
      authStore.setSession(response)
      ElMessage.success('登录成功')
      closeAuthDialog()
      if (authStore.isAdmin) {
        await router.push('/admin')
      } else {
        await router.push('/') // 登录后默认跳转到工作台
      }
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
      const response = await submitRegister()
      authStore.setSession(response)
      ElMessage.success('注册成功，已为你自动登录')
      closeAuthDialog()
      if (authStore.isAdmin) {
        await router.push('/admin')
      }
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '注册失败')
    } finally {
      authLoading.value = false
    }
  }

  const handleCreateNote = async () => {
    if (!authStore.isLoggedIn) {
      ElMessage.warning('请先登录以继续操作')
      openLoginDialog()
      return
    }

    fullscreenLoading.value = true
    try {
      const { note } = await createNote({
        title: '无标题笔记',
        content: '',
      })
      await router.push(`/editor?id=${note.id}`)
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '创建笔记失败')
    } finally {
      fullscreenLoading.value = false
    }
  }

  const handleAvatarLogout = async () => {
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST',
      })
      ElMessage.success('已退出登录')
    } catch (error: any) {
      ElMessage.error(error?.data?.statusMessage || error?.data?.message || '退出失败')
    } finally {
      authStore.clearSession()
      await router.push('/')
    }
  }

  const handleAvatarMenuCommand = async (command: string) => {
    if (command === 'logout') {
      await handleAvatarLogout()
      return
    }

    if (command === 'profile') {
      await router.push('/personal')
      return
    }
  }

  const handleSearch = () => {
    if (!authStore.isLoggedIn) {
      ElMessage.warning('请先登录')
      openLoginDialog()
      return
    }
    if (!searchQuery.value.trim()) {
      ElMessage.warning('请输入搜索关键词')
      return
    }

    router.push(`/search-result?query=${encodeURIComponent(searchQuery.value.trim())}`)
  }

  const handleNotificationChange = async (value: string) => {
    const filterMap: Record<string, 'all' | 'read' | 'unread'> = {
      全部: 'all',
      已读: 'read',
      未读: 'unread',
    }
    const filter = filterMap[value] || 'all'
    notificationLoading.value = true
    try {
      const res = await listNotifications(filter, 1, 50)
      notificationList.value = res.notifications
    } catch {
      ElMessage.error('加载失败')
    } finally {
      notificationLoading.value = false
    }
  }

  const handleNotificationOpen = () => {
    handleNotificationChange(notificationStatus.value)
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await notificationStore.markNotificationAsRead(notification.id)
      notification.isRead = true
    }
    selectedNotification.value = notification
    isNotificationDetailVisible.value = true
  }

  const handleMarkAllRead = async () => {
    await notificationStore.markAllNotificationsAsRead()
    notificationList.value.forEach((n) => (n.isRead = true))
  }

  watch(
    () => authStore.isLoggedIn,
    async (loggedIn) => {
      if (loggedIn) {
        await notificationStore.fetchUnreadCount()
      } else {
        notificationStore.reset()
      }
    },
  )

  onMounted(async () => {
    await authStore.initialize()
    if (authStore.isLoggedIn) {
      await notificationStore.fetchUnreadCount()
    }
  })
</script>

<template>
  <div
    class="sidebar-container relative h-screen bg-[#fafafa] transition-all duration-300 ease-in-out group"
    :style="{ width: isCollapse ? '64px' : '256px' }"
  >
    <div
      class="h-14 flex items-center justify-between overflow-hidden whitespace-nowrap px-5! mt-2!"
    >
      <span v-if="!isCollapse" class="font-bold text-gray-700">Multimodal-Notes</span>

      <template v-if="!isCollapse">
        <div class="account-status flex justify-evenly gap-2">
          <el-button
            v-if="!authStore.isLoggedIn"
            size="default"
            type="primary"
            @click="openLoginDialog"
          >
            登录
          </el-button>
          <div v-else class="flex items-center gap-0.5">
            <el-tooltip
              v-if="!authStore.isAdmin"
              content="消息中心"
              placement="bottom"
              :show-arrow="false"
            >
              <div class="relative cursor-pointer" @click="isNotificationVisible = true">
                <Bell :size="16" class="text-gray-700 outline-none" />
                <span
                  v-if="notificationStore.unreadCount > 0"
                  class="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full min-w-4 h-4 flex items-center justify-center px-1"
                >
                  {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
                </span>
              </div>
            </el-tooltip>
            <el-dropdown
              trigger="hover"
              placement="bottom-start"
              :show-arrow="false"
              popper-class="avatar-menu-popper"
              @command="handleAvatarMenuCommand"
            >
              <el-avatar :size="36" :src="userAvatar" class="cursor-pointer translate-x-1.5" />
              <template #dropdown>
                <el-dropdown-menu class="font-medium">
                  <el-dropdown-item disabled class="user-menu-header">
                    <div class="user-menu-profile">
                      <el-avatar :size="40" :src="userAvatar" />
                      <div class="user-menu-text">
                        <div class="user-menu-name">{{ menuDisplayName }}</div>
                        <div class="user-menu-sub">{{ menuSubLabel }}</div>
                      </div>
                    </div>
                  </el-dropdown-item>
                  <el-dropdown-item command="profile" class="flex items-center gap-2 py-1">
                    <User :size="16" />个人中心
                  </el-dropdown-item>
                  <el-dropdown-item
                    divided
                    command="logout"
                    class="logout-item flex items-center gap-2 py-1"
                  >
                    <LogOut :size="16" /> 退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>

      <template v-else>
        <el-button
          v-if="!authStore.isLoggedIn"
          size="small"
          circle
          type="primary"
          class="login-mini-btn"
          @click="openLoginDialog"
        >
          <LogIn :size="16" />
        </el-button>

        <el-dropdown
          v-else
          trigger="hover"
          placement="bottom-start"
          :show-arrow="false"
          popper-class="avatar-menu-popper"
          @command="handleAvatarMenuCommand"
        >
          <el-avatar :size="32" :src="userAvatar" class="cursor-pointer" />
          <template #dropdown>
            <el-dropdown-menu class="font-medium">
              <el-dropdown-item disabled class="user-menu-header">
                <div class="user-menu-profile">
                  <el-avatar :size="40" :src="userAvatar" />
                  <div class="user-menu-text">
                    <div class="user-menu-name">{{ menuDisplayName }}</div>
                    <div class="user-menu-sub">{{ menuSubLabel }}</div>
                  </div>
                </div>
              </el-dropdown-item>
              <el-dropdown-item command="profile" class="flex items-center gap-2 py-1"
                ><User :size="16" /> 个人中心</el-dropdown-item
              >
              <el-dropdown-item
                divided
                command="logout"
                class="logout-item flex items-center gap-2 py-1"
              >
                <LogOut :size="16" /> 退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </div>
    <div v-if="!authStore.isAdmin" class="flex justify-evenly my-2!">
      <el-input
        v-if="!isCollapse"
        v-model="searchQuery"
        style="width: 180px; height: 36px"
        size="large"
        placeholder="搜索"
        clearable
        class="el-border-radius rounded-input"
        :prefix-icon="Search"
        @keyup.enter="handleSearch"
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

    <div v-else v-show="!isCollapse" class="font-bold px-5 mb-2">
      <el-tag type="success">管理员账户</el-tag>
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
                class="rounded-input"
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
                class="rounded-input"
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
                  class="rounded-input"
                  @keyup.enter="handleAuthEnter"
                />
              </el-form-item>

              <el-form-item prop="username">
                <el-input
                  v-model="authForm.username"
                  placeholder="请输入用户名（3-20位，字母数字下划线）"
                  size="large"
                  class="rounded-input"
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
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model="isNotificationVisible"
      :show-footer="false"
      :show-close="false"
      width="40vw"
      :close-on-click-modal="true"
      :destroy-on-close="true"
      :style="{ height: '60vh' }"
      @open="handleNotificationOpen"
    >
      <template #header>
        <div class="flex items-center font-bold text-base mb-2! gap-4 mx-4">
          <span>消息中心</span>
          <el-segmented
            v-model="notificationStatus"
            :options="['全部', '已读', '未读']"
            @change="handleNotificationChange"
          />
          <div class="flex justify-end items-center ml-auto">
            <el-button link type="primary" size="small" @click="handleMarkAllRead">
              全部已读
            </el-button>
          </div>
        </div>
      </template>

      <template #default>
        <div class="flex-1 min-h-0 flex flex-col overflow-x-hidden">
          <div v-if="notificationLoading" class="flex-1 flex items-center justify-center">
            <el-icon class="is-loading" :size="24"><Loader /></el-icon>
          </div>
          <template v-else-if="notificationList.length > 0">
            <el-scrollbar max-height="50vh">
              <div
                v-for="item in notificationList"
                :key="item.id"
                class="p-3 rounded-lg mb-2 cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200 mx-4"
                :class="{ 'bg-blue-50/50': !item.isRead }"
                @click="handleNotificationClick(item)"
              >
                <div class="flex items-center justify-between mb-1 gap-2">
                  <div class="flex items-center gap-2 min-w-0 flex-1">
                    <el-tag
                      size="small"
                      :type="item.type === 'BROADCAST' ? 'warning' : 'info'"
                      class="shrink-0"
                    >
                      {{ item.type === 'BROADCAST' ? '公告' : '提示' }}
                    </el-tag>
                    <span class="font-semibold text-sm truncate">{{ item.title }}</span>
                  </div>
                  <span v-if="!item.isRead" class="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                </div>
                <p class="text-sm text-gray-500 line-clamp-2">{{ item.content }}</p>
                <div class="text-xs text-gray-400 mt-1">
                  {{ new Date(item.createdAt).toLocaleString() }}
                </div>
              </div>
            </el-scrollbar>
          </template>
          <el-empty v-else :image-size="120" description="暂无通知" />
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model="isNotificationDetailVisible"
      :show-footer="false"
      :show-close="true"
      width="40vw"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <el-tag
            size="small"
            :type="selectedNotification?.type === 'BROADCAST' ? 'warning' : 'info'"
          >
            {{ selectedNotification?.type === 'BROADCAST' ? '公告' : '提示' }}
          </el-tag>
          <span class="font-bold text-base">{{ selectedNotification?.title }}</span>
        </div>
      </template>
      <template #default>
        <div v-if="selectedNotification" class="space-y-3">
          <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {{ selectedNotification.content }}
          </p>
          <div
            class="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100"
          >
            <span>{{ selectedNotification.sender?.username || '系统' }}</span>
            <span>{{ new Date(selectedNotification.createdAt).toLocaleString() }}</span>
          </div>
        </div>
      </template>
    </Dialog>

    <el-menu
      :default-active="activeIndex"
      class="el-menu-vertical bg-gray-100 h-full font-bold"
      :collapse="isCollapse"
      :collapse-transition="false"
    >
      <template v-if="!authStore.isAdmin">
        <NuxtLink to="/">
          <el-menu-item index="1">
            <el-icon><Layers2 /></el-icon>
            <template #title>工作台</template>
          </el-menu-item>
        </NuxtLink>

        <NuxtLink to="/my-notes">
          <el-menu-item index="2">
            <el-icon><Notebook /></el-icon>
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
            <el-icon><Trash2 /></el-icon>
            <template #title>回收站</template>
          </el-menu-item>
        </NuxtLink>

        <NuxtLink to="/about">
          <el-menu-item index="5">
            <el-icon><MessageCircleQuestionMark /></el-icon>
            <template #title>快速指南</template>
          </el-menu-item>
        </NuxtLink>
      </template>

      <template v-else>
        <NuxtLink to="/admin">
          <el-menu-item index="6">
            <el-icon><Presentation /></el-icon>
            <template #title>总览面板</template>
          </el-menu-item>
        </NuxtLink>
        <NuxtLink to="/admin/users">
          <el-menu-item index="7">
            <el-icon><User /></el-icon>
            <template #title>用户管理</template>
          </el-menu-item>
        </NuxtLink>
        <NuxtLink to="/admin/notes">
          <el-menu-item index="8">
            <el-icon><Notebook /></el-icon>
            <template #title>笔记管理</template>
          </el-menu-item>
        </NuxtLink>
        <NuxtLink to="/admin/notifications">
          <el-menu-item index="9">
            <el-icon><Bell /></el-icon>
            <template #title>通知管理</template>
          </el-menu-item>
        </NuxtLink>
        <NuxtLink to="/admin/sessions">
          <el-menu-item index="10">
            <el-icon><Clock /></el-icon>
            <template #title>登录日志</template>
          </el-menu-item>
        </NuxtLink>
        <NuxtLink to="/admin/operations">
          <el-menu-item index="11">
            <el-icon><ClipboardList /></el-icon>
            <template #title>操作日志</template>
          </el-menu-item>
        </NuxtLink>
      </template>
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
          <ChevronLast v-if="isCollapse" />
          <ChevronFirst v-else />
        </el-icon>
      </el-button>
    </div>
  </div>
</template>

<style scoped>
  .el-menu-vertical {
    --el-menu-bg-color: #fafafa;
    --el-menu-border-color: transparent;
  }

  .el-menu-vertical:not(.el-menu--collapse) {
    width: 100%;
  }

  .el-border-radius {
    --el-border-radius-base: 8px;
  }

  .account-status {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .account-name {
    font-size: 14px;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .login-mini-btn {
    width: 32px;
    height: 32px;
    padding: 0;
  }

  :deep(.avatar-menu-popper) {
    min-width: 170px;
  }

  :deep(.avatar-menu-popper .user-menu-header) {
    opacity: 1;
    cursor: default;
    border-bottom: 1px solid #f3f4f6;
    margin-bottom: 2px;
    padding: 10px 12px;
  }

  :deep(.avatar-menu-popper .user-menu-header:hover) {
    background-color: #ffffff;
  }

  .user-menu-profile {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .user-menu-text {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .user-menu-name {
    font-size: 15px;
    font-weight: 700;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }

  .user-menu-sub {
    font-size: 12px;
    color: #6b7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }

  :deep(.avatar-menu-popper .logout-item) {
    color: #dc2626;
  }

  :deep(.avatar-menu-popper .logout-item:hover) {
    background-color: #fef2f2;
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

  .rounded-input :deep(.el-input__wrapper) {
    border-radius: 8px !important;
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
