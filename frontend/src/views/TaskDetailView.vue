<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import api from '../api/client';
import { emit as socketEmit, on, off } from '../services/socket';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';
import FileUpload from '../components/FileUpload.vue';
import VideoPlayer from '../components/VideoPlayer.vue';
import { formatDateTime } from '../utils/formatDate';

const route = useRoute();
const auth = useAuthStore();
const toast = useToastStore();
const taskId = computed(() => route.params.id);

const task = ref(null);
const comments = ref([]);
const attachments = ref([]);
const newComment = ref('');
const typingUser = ref(null);
let typingTimer = null;

const videoAttachment = computed(() =>
  attachments.value.find((a) => a.mime_type?.startsWith('video/'))
);

async function loadTask() {
  const { data } = await api.get(`/tasks/${taskId.value}`);
  task.value = data;
  comments.value = data.comments || [];
  attachments.value = data.attachments || [];
}

async function submitComment() {
  if (!newComment.value.trim()) return;
  const { data } = await api.post(`/tasks/${taskId.value}/comments`, {
    comment: newComment.value,
  });
  newComment.value = '';
  socketEmit('comment:typing', { taskId: taskId.value, typing: false });
  onCommentAdded(data);
}

function onTypingInput() {
  socketEmit('comment:typing', { taskId: taskId.value, typing: true });
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    socketEmit('comment:typing', { taskId: taskId.value, typing: false });
  }, 1500);
}

function onCommentAdded(comment) {
  if (String(comment.task_id) !== String(taskId.value)) return;
  if (!comments.value.find((c) => c.id === comment.id)) {
    comments.value.push(comment);
  }
}

function onTyping({ userId, name, typing }) {
  if (userId === auth.user?.id) return;
  typingUser.value = typing ? name : null;
}

function onAttachmentAdded(att) {
  if (String(att.task_id) === String(taskId.value)) {
    attachments.value.push(att);
  }
}

async function downloadFile(id, fileName) {
  const { data } = await api.get(`/attachments/${id}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

async function deleteAttachment(id) {
  await api.delete(`/attachments/${id}`);
  attachments.value = attachments.value.filter((a) => a.id !== id);
  toast.show('Attachment removed', 'info');
}

onMounted(async () => {
  socketEmit('task:join', taskId.value);
  on('comment:added', onCommentAdded);
  on('comment:typing', onTyping);
  on('attachment:added', onAttachmentAdded);
  await loadTask();
});

onUnmounted(() => {
  socketEmit('task:leave', taskId.value);
  off('comment:added', onCommentAdded);
  off('comment:typing', onTyping);
  off('attachment:added', onAttachmentAdded);
});
</script>

<template>
  <div v-if="task" class="detail">
    <router-link to="/" class="back">← Back</router-link>
    <div class="card">
      <h1>{{ task.title }}</h1>
      <p class="desc">{{ task.description }}</p>
      <div class="tags">
        <span class="badge">{{ task.status }}</span>
        <span class="priority">{{ task.priority }}</span>
      </div>
    </div>

    <section class="section card">
      <h2>Attachments</h2>
      <FileUpload :task-id="taskId" @uploaded="(a) => attachments.push(a)" />
      <ul class="attach-list">
        <li v-for="a in attachments" :key="a.id">
          <span>{{ a.file_name }} ({{ (a.file_size / 1024).toFixed(1) }} KB)</span>
          <button type="button" class="btn btn-ghost" @click="downloadFile(a.id, a.file_name)">
            Download
          </button>
          <button class="btn btn-danger" @click="deleteAttachment(a.id)">Delete</button>
        </li>
      </ul>
    </section>

    <section v-if="videoAttachment" class="section card">
      <h2>Video</h2>
      <VideoPlayer :attachment-id="videoAttachment.id" />
    </section>

    <section class="section card">
      <h2>Comments</h2>
      <p v-if="typingUser" class="typing">{{ typingUser }} is typing...</p>
      <div class="comments">
        <div v-for="c in comments" :key="c.id" class="comment">
          <strong>{{ c.author?.name }}</strong>
          <span class="time">{{ formatDateTime(c) }}</span>
          <p>{{ c.comment }}</p>
        </div>
      </div>
      <form class="comment-form" @submit.prevent="submitComment">
        <textarea
          v-model="newComment"
          rows="2"
          placeholder="Write a comment..."
          @input="onTypingInput"
        />
        <button type="submit" class="btn btn-primary">Post</button>
      </form>
    </section>
  </div>
  <div v-else class="loading">Loading task...</div>
</template>

<style scoped>
.back {
  display: inline-block;
  margin-bottom: 1rem;
  color: var(--muted);
  text-decoration: none;
}
.desc {
  color: var(--muted);
  margin: 0.75rem 0;
}
.tags {
  display: flex;
  gap: 0.5rem;
}
.section {
  margin-top: 1rem;
}
.section h2 {
  margin-bottom: 1rem;
  font-size: 1.1rem;
}
.attach-list {
  list-style: none;
  margin-top: 1rem;
}
.attach-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}
.comments {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 1rem;
}
.comment {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border);
}
.comment .time {
  font-size: 0.75rem;
  color: var(--muted);
  margin-left: 0.5rem;
}
.typing {
  font-size: 0.85rem;
  color: var(--primary);
  font-style: italic;
}
.comment-form textarea {
  width: 100%;
  margin-bottom: 0.5rem;
  padding: 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
}
.loading {
  color: var(--muted);
  text-align: center;
  padding: 2rem;
}
</style>
