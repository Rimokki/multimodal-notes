<script setup lang="ts">
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
  const route = useRoute()
  const router = useRouter()

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
    :style="{ width: isCollapse ? '64px' : '256px' }">
    <div class="h-14 flex items-center justify-evenly overflow-hidden whitespace-nowrap">
      <span v-if="!isCollapse" class="font-bold text-gray-700 text-lg">Multimodal-Notes</span>
      <el-avatar
        :size="36"
        src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
    </div>
    <div class="flex justify-evenly my-2!">
      <el-input
        v-if="!isCollapse"
        readonly
        style="width: 180px; height: 36px"
        size="large"
        placeholder="搜索"
        class="el-border-radius"
        :prefix-icon="Search" />
      <el-tooltip content="新建笔记" placement="bottom" effect="light">
        <el-button
          v-loading.fullscreen.lock="fullscreenLoading"
          type="default"
          :icon="Plus"
          class="el-border-radius p-2! w-9! h-9!"
          @click="handleCreateNote" />
      </el-tooltip>
    </div>

    <el-menu
      :default-active="activeIndex"
      class="el-menu-vertical bg-gray-100 h-full font-bold"
      :collapse="isCollapse"
      :collapse-transition="false">
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
      class="absolute top-1/2 -right-3 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <el-button
        circle
        size="small"
        class="shadow-md bg-white border-gray-100 hover:text-primary"
        @click="toggleCollapse">
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
</style>
