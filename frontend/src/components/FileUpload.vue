<script setup>
import { ref } from 'vue';
import api from '../api/client';
import { useToastStore } from '../stores/toast';
import {
  ACCEPT_INPUT,
  isAllowedAttachment,
  getAttachmentCategory,
  attachmentTypeLabel,
} from '../utils/attachmentTypes';

const props = defineProps({
  taskId: { type: [Number, String], required: true },
});
const emit = defineEmits(['uploaded']);

const toast = useToastStore();
const dragging = ref(false);
const progress = ref(0);
const uploading = ref(false);
const fileInput = ref(null);

function validateFile(file) {
  if (!isAllowedAttachment(file)) {
    toast.show(
      'Only images, videos, and documents (PDF, Word, Excel, etc.) are allowed.',
      'error'
    );
    return false;
  }
  return true;
}

async function uploadFile(file) {
  if (!file || !validateFile(file)) return;

  uploading.value = true;
  progress.value = 0;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const { data } = await api.post(`/tasks/${props.taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        progress.value = Math.round((e.loaded * 100) / (e.total || 1));
      },
    });
    const kind = attachmentTypeLabel(getAttachmentCategory(file));
    toast.show(`${kind} uploaded: ${file.name}`, 'success');
    emit('uploaded', data);
  } catch (e) {
    toast.show(e.response?.data?.message || 'Upload failed', 'error');
  } finally {
    uploading.value = false;
    progress.value = 0;
  }
}

function onDrop(e) {
  dragging.value = false;
  uploadFile(e.dataTransfer.files[0]);
}

function onSelect(e) {
  uploadFile(e.target.files[0]);
  e.target.value = '';
}
</script>

<template>
  <div
    class="dropzone"
    :class="{ dragging, uploading }"
    @dragover.prevent="dragging = true"
    @dragleave="dragging = false"
    @drop.prevent="onDrop"
    @click="fileInput?.click()"
  >
    <input
      ref="fileInput"
      type="file"
      hidden
      :accept="ACCEPT_INPUT"
      @change="onSelect"
    />
    <p v-if="!uploading">Drag & drop a file here, or click to browse</p>
    <p v-else>Uploading... {{ progress }}%</p>
    <div v-if="uploading" class="progress-bar">
      <div class="progress-fill" :style="{ width: `${progress}%` }" />
    </div>
    <p class="hint">
      Images · Videos · Documents (PDF, Word, Excel, PowerPoint, TXT, CSV, ZIP) — max 100MB
    </p>
  </div>
</template>

<style scoped>
.dropzone {
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.dropzone.dragging,
.dropzone:hover {
  border-color: var(--primary);
  background: rgba(59, 130, 246, 0.05);
}
.hint {
  font-size: 0.75rem;
  color: var(--muted);
  margin-top: 0.5rem;
}
.progress-bar {
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  margin-top: 1rem;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.2s;
}
</style>
