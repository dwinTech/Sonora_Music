<template>
  <main class="auth-screen" :class="`auth-mode-${mode}`">
    <section class="auth-card" :class="{ 'auth-card-signup': mode === 'signup' }">
      <span class="auth-mode-icon">
        <q-icon name="verified_user" />
      </span>
      <h1>{{ panelTitle }}</h1>
      <p v-if="mode === 'forgot'" class="auth-description">{{ panelDescription }}</p>

      <div v-if="setupError" class="auth-message auth-error" role="alert">{{ setupError }}</div>
      <div v-if="errorMessage" class="auth-message auth-error" role="alert">
        {{ errorMessage }}
      </div>
      <button
        v-if="showResendConfirmation"
        class="auth-forgot"
        type="button"
        :disabled="submitting || resendingConfirmation || !email"
        @click="resendConfirmation"
      >
        {{ resendingConfirmation ? 'Sending confirmation…' : 'Resend confirmation email' }}
      </button>
      <div v-if="successMessage" class="auth-message auth-success" role="status">
        {{ successMessage }}
      </div>

      <q-form
        v-if="mode === 'login' || mode === 'signup'"
        class="auth-form"
        @submit.prevent="submit"
      >
        <div v-if="mode === 'signup'" class="auth-field">
          <label class="auth-field-label" for="auth-user-name">User Name</label>
          <q-input
            id="auth-user-name"
            v-model.trim="userName"
            autocomplete="username"
            class="auth-input"
            dense
            placeholder="Enter your user name"
            outlined
            :rules="[(value) => Boolean(value) || 'Enter your user name']"
          />
        </div>
        <div class="auth-field">
          <label class="auth-field-label" for="auth-email">Email Address</label>
          <q-input
            id="auth-email"
            v-model.trim="email"
            autocomplete="email"
            class="auth-input"
            dense
            placeholder="Enter your email address"
            outlined
            type="email"
            :rules="[(value) => Boolean(value) || 'Enter your email address']"
          />
        </div>
        <div class="auth-field">
          <div class="auth-password-label-row">
            <label class="auth-field-label" for="auth-password">Password</label>
            <button
              v-if="mode === 'login'"
              class="auth-forgot"
              type="button"
              @click="switchMode('forgot')"
            >
              Forgot password?
            </button>
          </div>
          <q-input
            id="auth-password"
            v-model="password"
            :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'"
            class="auth-input"
            dense
            placeholder="Enter your password"
            outlined
            :type="showPassword ? 'text' : 'password'"
            :rules="
              mode === 'signup'
                ? [
                    (value) =>
                      passwordRequirements.every((requirement) => requirement.met) ||
                      'Meet all password requirements',
                  ]
                : [(value) => Boolean(value) || 'Enter your password']
            "
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
        </div>
        <div v-if="mode === 'signup'" class="auth-password-panel">
          <div class="auth-password-heading">
            <span>Password requirements</span>
            <span>{{ metPasswordRequirementCount }} of 6 met</span>
          </div>
          <ul
            class="auth-password-requirements"
            aria-label="Password requirements"
            aria-live="polite"
          >
            <li
              v-for="requirement in passwordRequirements"
              :key="requirement.label"
              :class="{ 'requirement-met': requirement.met }"
            >
              <q-icon :name="requirement.met ? 'check_circle' : 'radio_button_unchecked'" />
              <span>{{ requirement.label }}</span>
            </li>
          </ul>
        </div>
        <div v-if="mode === 'signup'" class="auth-field">
          <label class="auth-field-label" for="auth-confirm-password">Confirm Password</label>
          <q-input
            id="auth-confirm-password"
            v-model="confirmPassword"
            autocomplete="new-password"
            class="auth-input"
            dense
            placeholder="Confirm your password"
            outlined
            :type="showConfirmPassword ? 'text' : 'password'"
            :rules="[
              (value) => Boolean(value) || 'Confirm your password',
              (value) => value === password || 'Passwords do not match',
            ]"
          >
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
        </div>
        <q-btn
          class="auth-submit"
          color="primary"
          unelevated
          no-caps
          :loading="submitting"
          :label="submitLabel"
          type="submit"
        />

        <div v-if="mode === 'login' || mode === 'signup'" class="auth-divider">
          <span>Or continue with</span>
        </div>
        <button
          v-if="mode === 'login' || mode === 'signup'"
          class="google-auth-button"
          type="button"
          :disabled="submitting"
          @click="signInWithGoogle"
        >
          <svg aria-hidden="true" viewBox="0 0 48 48">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
              transform="translate(0 5)"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.05 47 31.95 47 24.55Z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"
              transform="translate(0 5)"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.94-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      </q-form>

      <q-form v-if="mode === 'forgot'" class="auth-form" @submit.prevent="submit">
        <div class="auth-field">
          <label class="auth-field-label" for="auth-reset-email">Email Address</label>
          <q-input
            id="auth-reset-email"
            v-model.trim="email"
            autocomplete="email"
            class="auth-input"
            dense
            placeholder="Enter your email address"
            outlined
            type="email"
            :rules="[(value) => Boolean(value) || 'Enter your email address']"
          />
        </div>
        <q-btn
          class="auth-submit"
          color="primary"
          unelevated
          no-caps
          :loading="submitting"
          :label="submitLabel"
          type="submit"
        />
      </q-form>

      <p v-if="mode === 'login'" class="auth-switch">
        New to Sonora?
        <button type="button" @click="switchMode('signup')">Create an account</button>
      </p>
      <p v-else-if="mode === 'signup'" class="auth-switch">
        Already have an account?
        <button type="button" @click="switchMode('login')">Sign in</button>
      </p>
      <p v-else class="auth-switch">
        Remember your password?
        <button type="button" @click="switchMode('login')">Back to sign in</button>
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getSupabaseClient } from '../../../lib/supabase/client';

type AuthMode = 'login' | 'signup' | 'forgot';

const props = defineProps<{
  setupError: string;
  initialMode: 'login' | 'signup';
}>();

const mode = ref<AuthMode>(props.initialMode);
const userName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const submitting = ref(false);
const resendingConfirmation = ref(false);
const showResendConfirmation = ref(false);
const errorMessage = ref('');
const router = useRouter();
const route = useRoute();
const confirmationMessage = 'Check your email to confirm your account, then sign in.';
const successMessage = ref(route.query.signup === 'confirmed' ? confirmationMessage : '');

onMounted(() => {
  if (route.query.signup === 'confirmed') {
    void router.replace({ path: route.path });
  }
});

const passwordRequirements = computed(() => [
  { label: 'At least 8 characters', met: password.value.length >= 8 },
  { label: 'One lowercase letter', met: /[a-z]/.test(password.value) },
  { label: 'One uppercase letter', met: /[A-Z]/.test(password.value) },
  { label: 'One number (0–9)', met: /\d/.test(password.value) },
  { label: 'One special symbol', met: /[^A-Za-z0-9\s]/.test(password.value) },
  { label: 'No spaces', met: !/\s/.test(password.value) },
]);
const metPasswordRequirementCount = computed(
  () => passwordRequirements.value.filter((requirement) => requirement.met).length,
);
watch(
  () => props.initialMode,
  (value) => {
    mode.value = value;
  },
);

const panelTitle = computed(() => {
  if (mode.value === 'signup') return 'Create Account';
  if (mode.value === 'forgot') return 'Reset Your Password';
  return 'Welcome Back';
});

const panelDescription = computed(() => {
  if (mode.value === 'signup') return 'Create an account to start building your personal library.';
  if (mode.value === 'forgot') return 'We’ll email you a secure link to reset your password.';
  return 'Sign in to pick up right where the music left off.';
});

const submitLabel = computed(() => {
  if (mode.value === 'signup') return 'Create account';
  if (mode.value === 'forgot') return 'Send reset link';
  return 'Sign in';
});

function switchMode(nextMode: AuthMode, query?: Record<string, string>) {
  mode.value = nextMode;
  password.value = '';
  confirmPassword.value = '';
  errorMessage.value = '';
  successMessage.value = '';
  showResendConfirmation.value = false;
  if (nextMode === 'login' || nextMode === 'signup') {
    const routeTarget = { path: `/${nextMode}` };
    if (query) {
      void router.push({ ...routeTarget, query });
      return;
    }
    void router.push(routeTarget);
  }
}

async function submit() {
  submitting.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  showResendConfirmation.value = false;

  try {
    const auth = getSupabaseClient().auth;
    if (mode.value === 'signup') {
      const { data, error } = await auth.signUp({
        email: email.value,
        password: password.value,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            username: userName.value,
          },
        },
      });
      if (error) throw error;
      if (!data.session) {
        switchMode('login', { signup: 'confirmed' });
        successMessage.value = confirmationMessage;
      }
      return;
    }

    if (mode.value === 'login') {
      const { error } = await auth.signInWithPassword({
        email: email.value,
        password: password.value,
      });
      if (error) throw error;
      return;
    }

    if (mode.value === 'forgot') {
      const { error } = await auth.resetPasswordForEmail(email.value, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) throw error;
      successMessage.value =
        'If an account exists for that email, a password reset link has been sent.';
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const normalizedMessage = message.toLowerCase();
    if (
      normalizedMessage.includes('email address not authorized') ||
      normalizedMessage.includes('email_not_authorized') ||
      normalizedMessage.includes('email_address_not_authorized')
    ) {
      errorMessage.value =
        'Supabase’s default email sender cannot send to this address because it is not authorized for the project. Configure a custom SMTP provider in Supabase Dashboard → Authentication → SMTP Settings to send signup emails to other addresses.';
    } else if (
      mode.value === 'signup' &&
      (normalizedMessage.includes('error sending confirmation email') ||
        normalizedMessage.includes('failed to send email'))
    ) {
      errorMessage.value =
        'Supabase could not send the signup confirmation email. In Supabase Dashboard → Authentication → Emails → SMTP Settings, verify that custom SMTP is enabled and the host, port, username, and password are correct. For Gmail, use smtp.gmail.com, port 465, your full Gmail address, and a Google App Password (not your regular Gmail password). Then check Authentication → Logs for the SMTP provider’s exact error. The account may already exist under Authentication → Users, so check there before trying signup again.';
    } else if (
      normalizedMessage.includes('email rate limit exceeded') ||
      normalizedMessage.includes('over_email_send_rate_limit')
    ) {
      errorMessage.value =
        mode.value === 'signup'
          ? 'Supabase’s default email sender is limited to about 2 messages per hour and may only send to project team addresses. Check Authentication → Users to see if the account was created. For signups to other email addresses, configure a custom SMTP provider under Authentication → SMTP Settings. Wait for the limit to reset before retrying.'
          : 'Supabase’s default email sender is limited to about 2 messages per hour. Wait for the limit to reset, or configure a custom SMTP provider under Authentication → SMTP Settings.';
    } else if (
      mode.value === 'login' &&
      (normalizedMessage.includes('email not confirmed') ||
        normalizedMessage.includes('email_not_confirmed'))
    ) {
      errorMessage.value =
        'Please confirm your email address before signing in. Check your inbox and spam folder, or request a new confirmation email below.';
      showResendConfirmation.value = true;
    } else if (mode.value === 'login' && normalizedMessage.includes('invalid login credentials')) {
      errorMessage.value =
        'Email or password is incorrect. Check that this account belongs to the configured Sonora project, or choose Forgot password? to reset it.';
    } else {
      errorMessage.value = message || 'Unable to complete that request.';
    }
  } finally {
    submitting.value = false;
  }
}

async function resendConfirmation() {
  if (!email.value || resendingConfirmation.value) return;

  resendingConfirmation.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  try {
    const { error } = await getSupabaseClient().auth.resend({
      type: 'signup',
      email: email.value,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    successMessage.value =
      'If this account still needs confirmation, a new confirmation link has been sent. Check your inbox and spam folder.';
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const normalizedMessage = message.toLowerCase();
    errorMessage.value =
      normalizedMessage.includes('rate limit') ||
      normalizedMessage.includes('over_email_send_rate_limit')
        ? 'Supabase has temporarily limited confirmation emails. Wait a while before trying again, or configure a custom SMTP provider in Supabase Auth settings.'
        : message || 'Unable to resend the confirmation email.';
  } finally {
    resendingConfirmation.value = false;
  }
}

async function signInWithGoogle() {
  submitting.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const { error } = await getSupabaseClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    errorMessage.value = message.includes('provider is not enabled')
      ? 'Google sign-in is disabled for this Supabase project. Enable Google under Authentication → Providers, then add your Google OAuth client ID and secret.'
      : message || 'Unable to connect your Google account.';
    submitting.value = false;
  }
}
</script>
