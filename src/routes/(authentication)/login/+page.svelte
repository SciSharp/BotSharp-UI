<script>
  import Link from 'svelte-link';
  import { _ } from 'svelte-i18n'
  import {
    Row,
    Col,
    CardBody,
    Card,
    Container,
    Form,
    Label,
    Input,
    Button,
    Alert
  } from '@sveltestrap/sveltestrap';
  import Headtitle from '$lib/common/shared/HeadTitle.svelte';
  import { getToken } from '$lib/services/auth-service.js';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
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

  let username = PUBLIC_ADMIN_USERNAME;
  let password = PUBLIC_ADMIN_PASSWORD;
  let isOpen = false;
  let msg = '';
  let status = '';
  let isSubmitting = false;
  let isRememberMe = false;

  onMount(() => {
    const userName = localStorage.getItem('user_name');
    isRememberMe = userName !== null;
    if(isRememberMe){
      username = userName || '';
    }
  });
  function handleRememberMe(){
    if(isRememberMe){
      localStorage.setItem("user_name", username);
    }
    else {
      localStorage.removeItem("user_name");
    }
  }

  /** @param {any} e */
  async function onSubmit(e) {
    isSubmitting = true;
    handleRememberMe();
    e.preventDefault();
    await getToken(username, password, '', () => {
      isOpen = true;
      msg = 'Authentication success';
      status = 'success';
      const redirectUrl = $page.url.searchParams.get('redirect');
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
      msg = 'Incorrect user name or password.'
      setTimeout(() => {
        isOpen = false;
        status = '';
        msg = '';
      }, 3000);
    });
    isSubmitting = false;
  }

  function onPasswordToggle() {
    const x = document.getElementById('user-password');
    if (!x) return;

    if (x.type === 'password') {
      x.type = 'text';
      const icon = document.getElementById('password-eye-icon');
      icon.className = 'mdi mdi-eye-off-outline';
    } else {
      x.type = 'password';
      const icon = document.getElementById('password-eye-icon');
      icon.className = 'mdi mdi-eye-outline';
    }
  }
</script>

<Headtitle title="Login" />
<div class="modern-auth-wrapper">


	<Container class="auth-container">
		<Row class="justify-content-center align-items-center min-vh-100">
			<Col md={10} lg={8} xl={6}>
				<div class="auth-card-wrapper">
					<Card class="auth-card border-0 shadow-lg">
						<!-- Header Section with Gradient -->
						<div class="auth-header">
							<div class="auth-header-content">
								<div class="auth-logo-section">
									<a href="/" class="auth-logo-link">
										<div class="logo-container">
											<img src={PUBLIC_LOGO_URL} alt="Logo" class="auth-logo-img" />
										</div>
									</a>
								</div>
								<div class="welcome-section">
									<h2 class="welcome-title">{$_('Welcome Back!')}</h2>
									<p class="welcome-subtitle">Sign in to continue to {PUBLIC_BRAND_NAME}</p>
								</div>
							</div>
							<div class="auth-illustration">
								<img src={PUBLIC_LOGIN_IMAGE} alt="Login Illustration" class="illustration-img" />
							</div>
						</div>

						<!-- Form Section -->
						<CardBody class="auth-form-section">
							<Alert {isOpen} color={status} class="modern-alert">{msg}</Alert>

							<Form class="auth-form" on:submit={onSubmit}>
								<div class="form-group">
									<Label for="username" class="form-label">Username</Label>
									<div class="input-wrapper">
							<i class="mdi mdi-account input-icon" aria-hidden="true"></i>
										<Input
											type="text"
											class="form-control modern-input"
											id="username"
											placeholder="Enter your username"
											disabled={isSubmitting}
											bind:value={username}
										/>
									</div>
								</div>

								<div class="form-group">
									<Label class="form-label" for="user-password">Password</Label>
									<div class="input-wrapper password-wrapper">
							<i class="mdi mdi-lock-outline input-icon" aria-hidden="true"></i>
										<Input
											type="password"
											class="form-control modern-input password-input"
											id="user-password"
											placeholder="Enter your password"
											disabled={isSubmitting}
											aria-label="Password"
											bind:value={password}
										/>
										<button
											type="button"
											class="password-toggle"
											disabled={isSubmitting}
											on:click={() => onPasswordToggle()}
										>
											<i id="password-eye-icon" class="mdi mdi-eye-outline" />
										</button>
									</div>
								</div>

								<div class="form-options">
									<div class="remember-me">
										<input
											class="form-check-input"
											type="checkbox"
											id="remember-check"
											disabled={isSubmitting}
											bind:checked={isRememberMe}
										/>
										<Label class="form-check-label" for="remember-check">Remember me</Label>
									</div>
									{#if PUBLIC_AUTH_ENABLE_FIND_PWD == 'true'}
									<a href="recoverpw" class="forgot-password">
										Forgot password?
									</a>
									{/if}
								</div>

								<div class="login-button-wrapper">
									<Button
										color="primary"
										disabled={isSubmitting}
										class="login-btn"
										type="submit"
									>
										{#if isSubmitting}
											<i class="mdi mdi-loading mdi-spin me-2"></i>
											Signing in...
										{:else}
											<i class="mdi mdi-login me-2"></i>
											Sign In
										{/if}
									</Button>
								</div>

								{#if PUBLIC_AUTH_ENABLE_SSO == 'true'}
								<div class="divider">
									<span class="divider-text">or continue with</span>
								</div>

								<div class="social-login">
									<a
										class="social-btn github-btn"
										href="{PUBLIC_SERVICE_URL}/sso/GitHub?redirectUrl={PUBLIC_LIVECHAT_HOST}page/user/me"
										title="Sign in with GitHub"
									>
										<i class="mdi mdi-github"></i>
									</a>

									<a
										class="social-btn keycloak-btn"
										href="{PUBLIC_SERVICE_URL}/sso/Keycloak?redirectUrl={PUBLIC_LIVECHAT_HOST}page/user/me"
										title="Sign in with Keycloak"
									>
										<i class="mdi mdi-cloud"></i>
									</a>

									<a
										class="social-btn google-btn"
										href="{PUBLIC_SERVICE_URL}/sso/Google?redirectUrl={PUBLIC_LIVECHAT_HOST}page/user/me"
										title="Sign in with Google"
									>
										<i class="mdi mdi-google"></i>
									</a>
								</div>
								{/if}
							</Form>
						</CardBody>
					</Card>

					<!-- Footer Section -->
					<div class="auth-footer">
						{#if PUBLIC_ALLOW_SIGNUP === 'true'}
						<p class="signup-text">
							Don't have an account?
							<a href="register" class="signup-link">
								Create one here
							</a>
						</p>
						{/if}

						<p class="copyright-text">
							Supported by © {new Date().getFullYear()} {PUBLIC_COMPANY_NAME}
						</p>
					</div>
				</div>
			</Col>
		</Row>
	</Container>
</div>

<style>
	.modern-auth-wrapper {
		min-height: 100vh;
		background: #ffffff;
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
	}



	.auth-container {
		position: relative;
		z-index: 2;
		width: 100%;
	}

	.auth-card-wrapper {
		animation: slideInUp 0.8s ease-out;
	}

	@keyframes slideInUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.auth-card {
		border-radius: 24px !important;
		background: #ffffff !important;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.06) !important;
		border: 1px solid rgba(0, 0, 0, 0.08) !important;
		overflow: hidden;
	}

	@media (prefers-color-scheme: dark) {
		.modern-auth-wrapper {
			background: #f8f9fa;
		}

		.auth-card {
			background: #ffffff !important;
			box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08) !important;
		}
	}

	.auth-header {
		background: linear-gradient(135deg, #0065a1 0%, #004d7a 100%);
		padding: 2.5rem 2rem;
		color: white;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-radius: 8px 8px 0 0;
	}

	@media (max-width: 768px) {
		.auth-header {
			flex-direction: column;
			text-align: center;
			padding: 2rem 1.5rem;
		}
	}

	.auth-header-content {
		flex: 1;
	}

	.auth-logo-section {
		margin-bottom: 1.5rem;
	}

	.auth-logo-link {
		text-decoration: none;
	}

	.logo-container {
		width: 80px;
		height: 80px;
		background: #ffffff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid rgba(255, 255, 255, 0.3);
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.logo-container:hover {
		transform: scale(1.05);
		background: #ffffff;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
	}

	.auth-logo-img {
		width: 50px;
		height: 50px;
		border-radius: 20%;
		object-fit: cover;
	}

	.welcome-title {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.welcome-subtitle {
		font-size: 1.1rem;
		opacity: 0.9;
		margin-bottom: 0;
	}

	.auth-illustration {
		flex-shrink: 0;
		margin-left: 2rem;
	}

	@media (max-width: 768px) {
		.auth-illustration {
			margin-left: 0;
			margin-top: 1.5rem;
		}
	}

	.illustration-img {
		max-width: 150px;
		height: auto;
		filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1));
	}

	@media (max-width: 768px) {
		.illustration-img {
			max-width: 120px;
		}
	}

	.auth-form-section {
		padding: 2.5rem 2rem !important;
	}

	@media (max-width: 768px) {
		.auth-form-section {
			padding: 2rem 1.5rem !important;
		}
	}

	.modern-alert {
		border-radius: 12px !important;
		border: none !important;
		font-weight: 500;
		margin-bottom: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-label {
		font-weight: 600;
		color: var(--bs-gray-700);
		margin-bottom: 0.5rem;
		font-size: 0.95rem;
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: #6c757d !important;
		font-size: 1.2rem;
		z-index: 10;
		pointer-events: none;
		display: inline-block;
		font-family: "Material Design Icons" !important;
		font-weight: normal;
		font-style: normal;
		line-height: 1;
	}

	:global(.modern-input) {
		width: 100%;
		padding-left: 3.25rem !important; /* extra left space for input icon to avoid overlap */
		padding-right: 1rem !important;
		height: 3rem;
		border-radius: 12px !important;
		border: 2px solid var(--bs-gray-200) !important;
		background: var(--bs-white) !important;
		font-size: 1rem;
		transition: all 0.3s ease;
		position: relative;
		z-index: 1;
	}

	:global(.password-wrapper .modern-input) {
		padding-right: 3rem !important;
	}

	:global(.modern-input:focus) {
		border-color: #0065a1 !important;
		box-shadow: 0 0 0 0.2rem rgba(0, 101, 161, 0.15) !important;
		background: var(--bs-white) !important;
		outline: none;
	}

	:global(.modern-input::placeholder) {
		color: var(--bs-gray-400);
	}

	.password-toggle {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		border: none !important;
		background: transparent !important;
		color: var(--bs-gray-500);
		padding: 0.5rem;
		border-radius: 6px;
		transition: all 0.3s ease;
		z-index: 10;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
	}

	.password-toggle:hover {
		background: var(--bs-gray-100) !important;
		color: var(--bs-gray-700);
	}

	.password-toggle:focus {
		box-shadow: none !important;
		outline: none;
	}

	.password-toggle i {
		font-size: 1.1rem;
		font-family: "Material Design Icons" !important;
		font-weight: normal;
		font-style: normal;
		display: inline-block;
		line-height: 1;
	}

	.form-options {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	@media (max-width: 576px) {
		.form-options {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}
	}

	.remember-me {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.form-check-input {
		border-radius: 4px;
		border: 2px solid var(--bs-gray-300);
	}

	.form-check-input:checked {
		background-color: #0065a1;
		border-color: #0065a1;
	}

	.form-check-input:focus {
		box-shadow: 0 0 0 0.2rem rgba(0, 101, 161, 0.15);
	}

	.form-check-label {
		font-size: 0.9rem;
		color: var(--bs-gray-600);
		margin-bottom: 0;
	}

	.forgot-password {
		color: #0065a1;
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.forgot-password:hover {
		color: #004d7a;
		text-decoration: underline;
	}

	.login-button-wrapper {
		margin-bottom: 1.5rem;
		display: flex;
		justify-content: center;
	}

	.login-btn {
		width: auto;
		min-width: 200px;
		height: 3.5rem;
		border-radius: 12px !important;
		background: linear-gradient(135deg, #0065a1 0%, #004d7a 100%) !important;
		border: none !important;
		font-weight: 600;
		font-size: 1.1rem;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		padding: 0 2rem;
	}

	.login-btn:before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s;
	}

	.login-btn:hover:before {
		left: 100%;
	}

	.login-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 25px rgba(0, 101, 161, 0.3);
	}

	.login-btn:active {
		transform: translateY(0);
	}

	.login-btn:disabled {
		opacity: 0.7;
		transform: none;
	}

	.login-btn:disabled:hover {
		transform: none;
		box-shadow: none;
	}

	.divider {
		position: relative;
		text-align: center;
		margin: 2rem 0;
	}

	.divider:before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: var(--bs-gray-300);
	}

	.divider-text {
		background: var(--bs-white);
		padding: 0 1rem;
		color: var(--bs-gray-500);
		font-size: 0.9rem;
		position: relative;
		z-index: 1;
	}

	.social-login {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
		justify-content: center;
	}

	@media (max-width: 576px) {
		.social-login {
			flex-direction: row;
			gap: 0.75rem;
		}
	}

	.social-btn {
		width: 50px;
		height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 12px;
		text-decoration: none;
		font-weight: 500;
		transition: all 0.3s ease;
		border: 2px solid transparent;
	}

	.social-btn.github-btn {
		background: #24292e;
		color: white;
	}

	.social-btn.github-btn:hover {
		background: #1a1e22;
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(36, 41, 46, 0.3);
	}

	.social-btn.keycloak-btn {
		background: #4285f4;
		color: white;
	}

	.social-btn.keycloak-btn:hover {
		background: #357ae8;
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(66, 133, 244, 0.3);
	}

	.social-btn.google-btn {
		background: #db4437;
		color: white;
	}

	.social-btn.google-btn:hover {
		background: #c23321;
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(219, 68, 55, 0.3);
	}

	.social-btn i {
		font-size: 1.4rem;
	}

	.auth-footer {
		text-align: center;
		margin-top: 2rem;
	}

	.signup-text {
		margin-bottom: 1rem;
		color: var(--bs-gray-600);
		font-size: 0.95rem;
	}

	.signup-link {
		color: #0065a1;
		text-decoration: none;
		font-weight: 600;
		margin-left: 0.25rem;
	}

	.signup-link:hover {
		color: #004d7a;
		text-decoration: underline;
	}

	.copyright-text {
		color: var(--bs-gray-500);
		font-size: 0.85rem;
		margin-bottom: 0;
	}

	.copyright-text i {
		color: #e74c3c;
		animation: heartbeat 1.5s ease-in-out infinite;
	}

	@keyframes heartbeat {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.form-label {
			color: var(--bs-gray-300);
		}

		:global(.modern-input) {
			background: var(--bs-gray-800);
			border-color: var(--bs-gray-600) !important;
			color: var(--bs-white);
		}

		:global(.modern-input:focus) {
			background: var(--bs-gray-800);
			border-color: #0065a1 !important;
		}

		:global(.modern-input::placeholder) {
			color: var(--bs-gray-400);
		}

		.input-icon {
			color: var(--bs-gray-400);
		}

		.password-toggle {
			color: var(--bs-gray-400);
		}

		.password-toggle:hover {
			background: var(--bs-gray-700) !important;
			color: var(--bs-gray-200);
		}

		.form-check-label {
			color: var(--bs-gray-300);
		}

		.divider-text {
			background: var(--bs-gray-800);
			color: var(--bs-gray-400);
		}

		.signup-text {
			color: var(--bs-gray-300);
		}

		.copyright-text {
			color: var(--bs-gray-400);
		}
	}
</style>