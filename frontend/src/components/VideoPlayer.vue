<script setup>
import { computed } from 'vue';

const props = defineProps({
  attachmentId: { type: Number, required: true },
});

const streamUrl = computed(() => {
  const base = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('token');
  return `${base}/attachments/${props.attachmentId}/stream?token=${token}`;
});
</script>

<template>
  <div class="video-wrap">
    <video
      controls
      preload="metadata"
      :src="streamUrl"
      crossorigin="anonymous"
    >
      Your browser does not support video playback.
    </video>
  </div>
</template>

<style scoped>
.video-wrap {
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}
video {
  width: 100%;
  max-height: 400px;
  display: block;
}
</style>
