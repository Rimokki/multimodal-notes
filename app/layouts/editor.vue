<script setup lang="ts">
  import { Star } from '@element-plus/icons-vue'

  const route = useRoute()
  const router = useRouter()
  const noteTitle = computed(() => route.meta.title || '未命名笔记')
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
    <div class="w-1/6 border-r border-gray-200">left</div>
    <div class="flex-1 flex flex-col">
      <div class="h-15 flex items-center justify-between px-10! border-b border-gray-200">
        <div class="ml-4 font-bold text-lg text-gray-700 flex items-center">
          <span class="text-lg">{{ noteTitle }}</span>
          <span class="font-normal text-sm ml-4! text-gray-400">
            {{ isEditing ? '编辑模式' : '预览模式' }}
          </span>
        </div>

        <div class="mr-4">
          <el-button
            :type="isMarked ? 'primary' : ''"
            :icon="Star"
            circle
            @click="toggleMark" />
          <el-button>分享</el-button>
          <el-button @click="goBack">返回</el-button>
          <el-button
            :type="isEditing ? '' : 'primary'"
            @click="toggleEditMode">
            {{ isEditing ? '预览' : '编辑' }}
          </el-button>
          <el-button type="danger">删除</el-button>
        </div>
      </div>
      <div class="flex-1 pl-60! pr-120! py-12! overflow-auto">
        <slot />
      </div>
    </div>
  </div>
</template>
