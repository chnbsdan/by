<template>
  <Teleport to="body">
    <Transition name="dialog-visible">
      <div
        v-if="visible"
        class="dialog-overlay"
        @click.self="handleOverlayClick"
      >
        <div class="dialog-content">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

function handleOverlayClick() {
  emit('close')
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.dialog-overlay {
  opacity: 1;
}
.dialog-content {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dialog-visible-enter-active,
.dialog-visible-leave-active {
  transition: opacity 0.25s ease;
}
.dialog-visible-enter-from,
.dialog-visible-leave-to {
  opacity: 0;
}
</style>