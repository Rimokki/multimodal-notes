<script lang="ts" setup>
  type DialogProps = {
    title?: string
    width?: string | number
    showFooter?: boolean
    showClose?: boolean
    confirmText?: string
    cancelText?: string
    confirmLoading?: boolean
    closeOnClickModal?: boolean
    destroyOnClose?: boolean
  }

  const props = withDefaults(defineProps<DialogProps>(), {
    title: '',
    width: '500px',
    showFooter: true,
    showClose: true,
    confirmText: '确认',
    cancelText: '取消',
    confirmLoading: false,
    closeOnClickModal: true,
    destroyOnClose: false,
  })

  const emit = defineEmits<{
    cancel: []
    confirm: []
    close: []
    open: []
    opened: []
    closed: []
  }>()

  const dialogVisible = defineModel({ default: false, type: Boolean })

  const handleCancel = () => {
    emit('cancel')
    dialogVisible.value = false
  }

  const handleConfirm = () => {
    emit('confirm')
  }
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    class="custom-transition-dialog"
    :title="props.title"
    :width="props.width"
    :close-on-click-modal="props.closeOnClickModal"
    :destroy-on-close="props.destroyOnClose"
    :show-close="props.showClose"
    transition="dialog-bounce"
    append-to-body
    @close="emit('close')"
    @open="emit('open')"
    @opened="emit('opened')"
    @closed="emit('closed')"
  >
    <template #header>
      <slot name="header"></slot>
    </template>
    <slot />

    <template v-if="props.showFooter" #footer>
      <slot name="footer" :close="handleCancel" :confirm="handleConfirm">
        <el-button @click="handleCancel">{{ props.cancelText }}</el-button>
        <el-button type="primary" :loading="props.confirmLoading" @click="handleConfirm">
          {{ props.confirmText }}
        </el-button>
      </slot>
    </template>
  </el-dialog>
</template>

<style>
  .custom-transition-dialog {
    border-radius: 12px !important;
    overflow: hidden;
  }

  .custom-transition-dialog .el-dialog__header {
    padding-bottom: 0 !important;
  }

  @media (max-width: 768px) {
    .custom-transition-dialog {
      --el-dialog-width: 92% !important;
    }
  }

  .dialog-bounce-enter-active,
  .dialog-bounce-leave-active,
  .dialog-bounce-enter-active .el-dialog,
  .dialog-bounce-leave-active .el-dialog {
    transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .dialog-bounce-enter-from,
  .dialog-bounce-leave-to {
    opacity: 0;
  }

  .dialog-bounce-enter-from .el-dialog,
  .dialog-bounce-leave-to .el-dialog {
    transform: scale(0.3) translateY(-50px);
    opacity: 0;
  }
</style>
