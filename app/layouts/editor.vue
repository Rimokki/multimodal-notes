<script setup lang="ts">
  import { Star } from '@element-plus/icons-vue'

  const router = useRouter()
  const noteTitleVal = useState('noteTitle')
  const noteTitle = computed(() => noteTitleVal.value || '无标题笔记')
  const isMarked = ref(false)
  const isEditing = useState('isEditing', () => true)

  const toggleMark = () => {
    isMarked.value = !isMarked.value
  }

  const toggleEditMode = () => {
    isEditing.value = !isEditing.value
  }

  const goBack = () => {
    router.back()
  }
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <div class="w-1/7 border-r border-gray-200">left</div>
    <div class="flex-1 flex flex-col">
      <div class="h-14 flex items-center justify-between px-10! border-b border-gray-200">
        <div class="ml-4 font-bold text-lg text-gray-600 flex items-center">
          <span class="text-lg">{{ noteTitle }}</span>
          <span class="font-normal text-sm ml-4! text-gray-400">
            {{ isEditing ? '编辑模式' : '预览模式' }}
          </span>
        </div>

        <div class="mr-4">
          <el-button :type="isMarked ? 'primary' : ''" :icon="Star" circle @click="toggleMark" />
          <el-button>分享</el-button>
          <el-button :type="isEditing ? '' : 'primary'" @click="toggleEditMode">
            {{ isEditing ? '预览' : '编辑' }}
          </el-button>
          <el-button @click="goBack">返回</el-button>
        </div>
      </div>

      <!-- 菜单栏挂载点 -->
      <div v-show="isEditing" id="toolbar-target" class="border-b border-gray-200 bg-white z-10" />

      <!-- 字数统计挂载点 -->
      <div v-show="isEditing" id="editor-character-count" class="fixed bottom-1 ml-2!" />

      <div class="flex-1 py-10! overflow-auto flex justify-center">
        <slot />
      </div>
    </div>
  </div>
</template>
