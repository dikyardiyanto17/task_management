<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useToastStore } from './stores/toast';

const auth = useAuthStore();
const toast = useToastStore();

onMounted(() => auth.init());
</script>

<template>
  <router-view />
  <div class="toast-container">
    <div
      v-for="t in toast.toasts"
      :key="t.id"
      class="toast"
      :class="t.type"
    >
      {{ t.message }}
    </div>
  </div>
</template>
