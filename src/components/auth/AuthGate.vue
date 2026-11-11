<template>
  <SonoraLibrary
    v-if="ready && session && !passwordRecovery"
    :user-id="session.user.id"
    :user-email="session.user.email || ''"
    @sign-out="signOut"
  />
  <q-page v-else class="auth-page">
    <div v-if="!ready" class="auth-loading">
      <q-spinner size="28px" /><span>Loading your library...</span>
    </div>
    <ResetPasswordForm
      v-else-if="passwordRecovery"
      :setup-error="setupError"
      @password-updated="onPasswordUpdated"
      @return-to-sign-in="onReturnToSignIn"
    />
    <AuthPanel v-else :initial-mode="initialMode" :setup-error="setupError" />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import type { Session, Subscription } from '@supabase/supabase-js';
import AuthPanel from '@/components/auth/AuthPanel.vue';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm.vue';
import SonoraLibrary from '@/components/library/SonoraLibrary.vue';
import { getSupabaseClient } from '../../../lib/supabase/client';

const props = withDefaults(
  defineProps<{
    initialMode?: 'login' | 'signup';
    recoveryPage?: boolean;
  }>(),
  { initialMode: 'login' },
);

const session = ref<Session | null>(null);
const ready = ref(false);
const passwordRecovery = ref(props.recoveryPage ?? false);
const recoveryInProgress = ref(props.recoveryPage ?? false);
const setupError = ref('');
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const initialMode = props.initialMode;
let authSubscription: Subscription | undefined;

onMounted(async () => {
  recoveryInProgress.value =
    props.recoveryPage ||
    window.location.hash.includes('type=recovery') ||
    new URLSearchParams(window.location.search).get('type') === 'recovery';
  passwordRecovery.value = recoveryInProgress.value;

  try {
    const client = getSupabaseClient();
    const { data } = client.auth.onAuthStateChange((event, nextSession) => {
      session.value = nextSession;
      if (event === 'PASSWORD_RECOVERY') {
        recoveryInProgress.value = true;
        passwordRecovery.value = true;
        if (route.path !== '/auth/reset-password') {
          void router.replace('/auth/reset-password');
        }
      }
      if (event === 'SIGNED_IN' && !recoveryInProgress.value) passwordRecovery.value = false;
      if (event === 'SIGNED_IN' && !recoveryInProgress.value && route.path !== '/library') {
        void router.replace('/library');
      } else if (event === 'SIGNED_OUT' && route.path === '/library') {
        recoveryInProgress.value = false;
        passwordRecovery.value = false;
        void router.replace('/login');
      }
    });
    authSubscription = data.subscription;

    const { data: sessionData, error } = await client.auth.getSession();
    if (error) throw error;
    session.value = sessionData.session;
    if (sessionData.session && !recoveryInProgress.value && route.path !== '/library') {
      await router.replace('/library');
    } else if (!sessionData.session && route.path === '/library') {
      await router.replace({ path: '/login' });
    }
  } catch (error) {
    setupError.value =
      error instanceof Error ? error.message : 'Unable to initialize authentication.';
  } finally {
    ready.value = true;
  }
});

onUnmounted(() => authSubscription?.unsubscribe());

async function onPasswordUpdated() {
  await leaveRecoveryPage();
}

async function onReturnToSignIn() {
  setupError.value = '';
  try {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throw error;
    session.value = null;
    recoveryInProgress.value = false;
    passwordRecovery.value = false;
    await router.replace('/login');
  } catch (error) {
    setupError.value =
      error instanceof Error ? error.message : 'Unable to return to sign in.';
  }
}

async function leaveRecoveryPage() {
  setupError.value = '';
  try {
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error) throw error;
    session.value = data.session;
    recoveryInProgress.value = false;
    passwordRecovery.value = false;
    await router.replace(data.session ? '/library' : '/login');
  } catch (error) {
    setupError.value =
      error instanceof Error ? error.message : 'Unable to return to your library.';
  }
}

async function signOut() {
  try {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throw error;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Unable to sign out.',
      position: 'bottom',
    });
  }
}
</script>
