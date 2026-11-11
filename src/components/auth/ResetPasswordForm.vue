<template>
  <main class="auth-screen auth-reset-screen">
    <section class="auth-card auth-card-reset">
      <div class="auth-brand auth-reset-brand">
        <span class="auth-equalizer"><i /><i /><i /><i /></span>
        <span>sonora<span>.</span></span>
      </div>

      <span class="auth-reset-icon">
        <q-icon name="verified_user" />
      </span>
      <h1>Reset Your Password</h1>
      <p class="auth-description">Enter and confirm your new password below.</p>

      <div v-if="setupError" class="auth-message auth-error" role="alert">{{ setupError }}</div>
      <div v-if="errorMessage" class="auth-message auth-error" role="alert">
        {{ errorMessage }}
      </div>

      <q-form class="auth-form" @submit.prevent="submit">
        <q-input
          v-model="password"
          autocomplete="new-password"
          class="auth-input"
          label="New Password"
          outlined
          :type="showPassword ? 'text' : 'password'"
          :rules="[(value) => isValidPassword(value) || 'Meet all password requirements']"
        >
          <template #prepend><q-icon name="lock_outline" /></template>
          <template #append>
            <q-btn
              flat
              round
              dense
              :icon="showPassword ? 'visibility_off' : 'visibility'"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>
        <div class="auth-reset-password-help">
          <strong>Password must contain:</strong>
          <span>At least 8 characters with uppercase, lowercase, number, and symbol.</span>
        </div>
        <q-input
          v-model="confirmPassword"
          autocomplete="new-password"
          class="auth-input"
          label="Confirm New Password"
          outlined
          :type="showConfirmPassword ? 'text' : 'password'"
          :rules="[
            (value) => Boolean(value) || 'Confirm your new password',
            (value) => value === password || 'Passwords do not match',
          ]"
        >
          <template #prepend><q-icon name="lock_outline" /></template>
          <template #append>
            <q-btn
              flat
              round
              dense
              :icon="showConfirmPassword ? 'visibility_off' : 'visibility'"
              :aria-label="showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'"
              @click="showConfirmPassword = !showConfirmPassword"
            />
          </template>
        </q-input>
        <q-btn
          class="auth-submit"
          color="primary"
          unelevated
          no-caps
          :loading="submitting"
          label="Update Password"
          type="submit"
        />
      </q-form>

      <p class="auth-switch">
        <button type="button" @click="returnToSignIn">Back to sign in</button>
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getSupabaseClient } from '../../../lib/supabase/client';

defineProps<{
  setupError: string;
}>();

const emit = defineEmits<{
  (event: 'password-updated'): void;
  (event: 'return-to-sign-in'): void;
}>();

const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const submitting = ref(false);
const errorMessage = ref('');

function isValidPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9\s]/.test(value) &&
    !/\s/.test(value)
  );
}

async function submit() {
  if (!isValidPassword(password.value)) {
    errorMessage.value = 'Meet all password requirements before updating your password.';
    return;
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Your passwords do not match.';
    return;
  }

  submitting.value = true;
  errorMessage.value = '';
  try {
    const { error } = await getSupabaseClient().auth.updateUser({ password: password.value });
    if (error) throw error;
    emit('password-updated');
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Unable to update your password.';
  } finally {
    submitting.value = false;
  }
}

function returnToSignIn() {
  emit('return-to-sign-in');
}
</script>
