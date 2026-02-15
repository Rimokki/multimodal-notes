<script setup lang="ts">
  import { ref } from 'vue'
  import {
    Plus,
    Star,
    Search,
    Document,
    Menu as IconMenu,
    Setting,
    Fold,
    Expand,
  } from '@element-plus/icons-vue'

  const isCollapse = ref(false)

  const state = reactive({
    circleUrl:
      'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    squareUrl:
      'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png',
    sizeList: ['small', '', 'large'] as const,
  })

  const toggleCollapse = () => {
    isCollapse.value = !isCollapse.value
  }
</script>

<template>
  <div
    class="sidebar-container relative h-screen bg-gray-100 transition-all duration-300 ease-in-out group"
    :style="{ width: isCollapse ? '64px' : '256px' }">
    <div
      class="h-14 flex items-center justify-evenly overflow-hidden whitespace-nowrap">
      <span v-if="!isCollapse" class="font-bold text-gray-700 text-lg"
        >Multimodal Notes</span
      >
      <el-avatar :size="36" :src="state.circleUrl" />
    </div>
    <div class="flex justify-evenly my-2!">
      <el-input
        v-if="!isCollapse"
        readonly
        style="width: 180px"
        size="large"
        placeholder="搜索"
        class="el-border-radius"
        :prefix-icon="Search" />
      <el-button
        type="default"
        size="large"
        :icon="Plus"
        class="w-4 h-4 el-border-radius" />
    </div>

    <el-menu
      default-active="1"
      class="el-menu-vertical bg-gray-100 h-full font-bold"
      :collapse="isCollapse"
      :collapse-transition="false">
      <el-menu-item index="1">
        <el-icon><icon-menu /></el-icon>
        <template #title>工作台</template>
      </el-menu-item>

      <el-menu-item index="2">
        <el-icon><document /></el-icon>
        <template #title>全部笔记</template>
      </el-menu-item>

      <el-menu-item index="3">
        <el-icon><star /></el-icon>
        <template #title>我的收藏</template>
      </el-menu-item>

      <el-menu-item index="4">
        <el-icon><setting /></el-icon>
        <template #title>应用设置</template>
      </el-menu-item>
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
    --el-border-radius-base: 12px;
  }
</style>
