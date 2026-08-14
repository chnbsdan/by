<template>
  <div class="ui-image">
    <div v-if="loading" class="ui-image__placeholder">
      <div class="ui-image__spinner" />
    </div>
    <img
      ref="imgRef"
      :src="src"
      :alt="alt"
      class="ui-image__img"
      :class="{ 'ui-image__img--loaded': !loading }"
      @load="onLoad"
      crossorigin="anonymous"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  }
})

const loading = ref(true)

function onLoad() {
  loading.value = false
}
</script>

<style scoped>
.ui-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.ui-image__img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  opacity: 0;
  transition: opacity 0.5s ease;
  display: block;
}
.ui-image__img--loaded {
  opacity: 1;
}
.ui-image__placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}
.ui-image__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>