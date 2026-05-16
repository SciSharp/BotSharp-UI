<script>
  import { _ } from 'svelte-i18n';
  import Headtitle from '$lib/common/shared/HeadTitle.svelte';
  import { getToken } from '$lib/services/auth-service.js';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import {
    PUBLIC_SERVICE_URL,
    PUBLIC_LIVECHAT_HOST,
    PUBLIC_LOGO_URL,
    PUBLIC_LOGIN_IMAGE,
    PUBLIC_BRAND_NAME,
    PUBLIC_ADMIN_USERNAME,
    PUBLIC_ADMIN_PASSWORD,
    PUBLIC_COMPANY_NAME,
    PUBLIC_ALLOW_SIGNUP,
    PUBLIC_AUTH_ENABLE_SSO,
    PUBLIC_AUTH_ENABLE_FIND_PWD,
  } from '$env/static/public';
  import { onMount } from 'svelte';
  import { resetStorage } from '$lib/helpers/store';

  let username = $state(PUBLIC_ADMIN_USERNAME);
  let password = $state(PUBLIC_ADMIN_PASSWORD);
  let isOpen = $state(false);
  let msg = $state('');
  let status = $state('');
  let isSubmitting = $state(false);
  let isRememberMe = $state(false);
  let showPassword = $state(false);

  onMount(() => {
    const userName = localStorage.getItem('user_name');
    isRememberMe = userName !== null;
    if (isRememberMe) {
      username = userName || '';
    }
  });

  function handleRememberMe() {
    if (isRememberMe) {
      localStorage.setItem('user_name', username);
    } else {
      localStorage.removeItem('user_name');
    }
  }

  /** @param {SubmitEvent} e */
  async function onSubmit(e) {
    isSubmitting = true;
    handleRememberMe();
    e.preventDefault();
    await getToken(username, password, '', () => {
      isOpen = true;
      msg = 'Authentication success';
      status = 'success';
      const redirectUrl = page.url.searchParams.get('redirect');
      isSubmitting = false;
      resetStorage();
      if (redirectUrl) {
        window.location.href = decodeURIComponent(redirectUrl);
      } else {
        goto('page/dashboard');
      }
    }, () => {
      isSubmitting = false;
      isOpen = true;
      status = 'danger';
      msg = 'Incorrect user name or password.';
      setTimeout(() => {
        isOpen = false;
        status = '';
        msg = '';
      }, 3000);
    });
    isSubmitting = false;
  }

  function onPasswordToggle() {
    showPassword = !showPassword;
  }
</script>

<Headtitle title="Login" />

<div class="flex min-h-screen items-center overflow-hidden bg-white dark:bg-gray-900">
  <div class="mx-auto w-full max-w-7xl px-4">
    <div class="flex min-h-screen items-center justify-center">
      <div class="w-full md:w-5/6 lg:w-2/3 xl:w-1/2">
        <div class="animate-slide-in-up py-8">

          <!-- Card -->
          <div class="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-gray-800 dark:ring-white/10">

            <!-- Gradient header -->
            <div class="flex flex-col items-center justify-between gap-6 bg-linear-to-br from-primary to-primary-hover px-6 py-8 text-center text-white md:flex-row md:gap-0 md:px-8 md:py-10 md:text-left">
              <div class="flex-1">
                <div class="mb-6 flex justify-center md:justify-start">
                  <a href="/">
                    <div class="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/30 bg-white shadow-md transition-transform hover:scale-105">
                      <img src={PUBLIC_LOGO_URL} alt="Logo" class="h-12 w-12 rounded-[20%] object-cover" />
                    </div>
                  </a>
                </div>
                <h2 class="mb-1 text-3xl font-bold drop-shadow-sm">{$_('Welcome Back!')}</h2>
                <p class="text-lg opacity-90">Sign in to continue to {PUBLIC_BRAND_NAME}</p>
              </div>
              <div class="md:ml-8 md:shrink-0">
                <img src={PUBLIC_LOGIN_IMAGE} alt="Login Illustration" class="max-w-[120px] drop-shadow-lg md:max-w-[150px]" />
              </div>
            </div>

            <!-- Form body -->
            <div class="px-6 py-8 md:px-8 md:py-10">
              {#if isOpen}
                <div
                  class="mb-6 rounded-xl px-4 py-3 font-medium {status === 'success' ? 'bg-green-100 text-green-800' : ''} {status === 'danger' ? 'bg-red-100 text-red-800' : ''}"
                  role="alert"
                >
                  {msg}
                </div>
              {/if}

              <form onsubmit={onSubmit}>
                <!-- Username -->
                <div class="mb-6">
                  <label for="username" class="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Username</label>
                  <div class="relative">
                    <i class="mdi mdi-account pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-xl text-gray-500 dark:text-gray-400" aria-hidden="true"></i>
                    <input
                      type="text"
                      id="username"
                      class="h-12 w-full rounded-xl border-2 border-gray-200 bg-white pl-[3.25rem] pr-4 text-base text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-70 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Enter your username"
                      disabled={isSubmitting}
                      bind:value={username}
                    />
                  </div>
                </div>

                <!-- Password -->
                <div class="mb-6">
                  <label for="user-password" class="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                  <div class="relative">
                    <i class="mdi mdi-lock-outline pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-xl text-gray-500 dark:text-gray-400" aria-hidden="true"></i>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="user-password"
                      class="h-12 w-full rounded-xl border-2 border-gray-200 bg-white pl-[3.25rem] pr-12 text-base text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-70 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Enter your password"
                      disabled={isSubmitting}
                      aria-label="Password"
                      bind:value={password}
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md bg-transparent text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none disabled:opacity-70 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                      aria-label="Toggle password visibility"
                      disabled={isSubmitting}
                      onclick={onPasswordToggle}
                    >
                      <i class="mdi {showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'} text-lg"></i>
                    </button>
                  </div>
                </div>

                <!-- Remember + forgot -->
                <div class="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                  <label class="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300" for="remember-check">
                    <input
                      class="h-4 w-4 rounded border-2 border-gray-300 accent-primary focus:ring-2 focus:ring-primary/15"
                      type="checkbox"
                      id="remember-check"
                      disabled={isSubmitting}
                      bind:checked={isRememberMe}
                    />
                    Remember me
                  </label>
                  {#if PUBLIC_AUTH_ENABLE_FIND_PWD == 'true'}
                    <a href="recoverpw" class="text-sm font-medium text-primary transition-colors hover:text-primary-hover hover:underline">
                      Forgot password?
                    </a>
                  {/if}
                </div>

                <!-- Submit -->
                <div class="mb-6 flex justify-center">
                  <button
                    type="submit"
                    class="login-btn cursor-pointer h-14 min-w-[200px] rounded-xl bg-linear-to-br from-primary to-primary-hover px-8 text-lg font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:translate-y-0 disabled:opacity-70 disabled:shadow-md"
                    disabled={isSubmitting}
                  >
                    {#if isSubmitting}
                      <i class="mdi mdi-loading mdi-spin mr-2"></i>
                      Signing in...
                    {:else}
                      <i class="mdi mdi-login mr-2"></i>
                      Sign In
                    {/if}
                  </button>
                </div>

                {#if PUBLIC_AUTH_ENABLE_SSO == 'true'}
                  <!-- Divider -->
                  <div class="relative my-8 text-center">
                    <div class="absolute inset-x-0 top-1/2 h-px bg-gray-300 dark:bg-gray-600"></div>
                    <span class="relative z-10 bg-white px-4 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">or continue with</span>
                  </div>

                  <!-- Social -->
                  <div class="mb-6 flex justify-center gap-4">
                    <a
                      class="flex h-[50px] w-[50px] items-center justify-center rounded-xl bg-[#24292e] text-white transition-all hover:-translate-y-0.5 hover:bg-[#1a1e22] hover:shadow-lg"
                      href="{PUBLIC_SERVICE_URL}/sso/GitHub?redirectUrl={PUBLIC_LIVECHAT_HOST}page/user/me"
                      title="Sign in with GitHub"
                    >
                      <i class="mdi mdi-github text-2xl"></i>
                    </a>
                    <a
                      class="flex h-[50px] w-[50px] items-center justify-center rounded-xl bg-[#4285f4] text-white transition-all hover:-translate-y-0.5 hover:bg-[#357ae8] hover:shadow-lg"
                      href="{PUBLIC_SERVICE_URL}/sso/Keycloak?redirectUrl={PUBLIC_LIVECHAT_HOST}page/user/me"
                      title="Sign in with Keycloak"
                    >
                      <i class="mdi mdi-cloud text-2xl"></i>
                    </a>
                    <a
                      class="flex h-[50px] w-[50px] items-center justify-center rounded-xl bg-[#db4437] text-white transition-all hover:-translate-y-0.5 hover:bg-[#c23321] hover:shadow-lg"
                      href="{PUBLIC_SERVICE_URL}/sso/Google?redirectUrl={PUBLIC_LIVECHAT_HOST}page/user/me"
                      title="Sign in with Google"
                    >
                      <i class="mdi mdi-google text-2xl"></i>
                    </a>
                  </div>
                {/if}
              </form>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-8 text-center">
            {#if PUBLIC_ALLOW_SIGNUP === 'true'}
              <p class="mb-4 text-sm text-gray-600 dark:text-gray-300">
                Don't have an account?
                <a href="register" class="ml-1 font-semibold text-primary transition-colors hover:text-primary-hover hover:underline">
                  Create one here
                </a>
              </p>
            {/if}
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Supported by © {new Date().getFullYear()} {PUBLIC_COMPANY_NAME}
            </p>
          </div>

        </div>
      </div>
    </div>
  </div>
</div>


