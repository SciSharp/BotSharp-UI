<script>
	import Headtitle from '$lib/common/shared/HeadTitle.svelte';
	import { goto } from '$app/navigation';
	import { PUBLIC_LOGO_URL, PUBLIC_COMPANY_NAME } from '$env/static/public';

	let username = $state('');
	let emailid = $state('');
	let password = $state('');
	let isOpen = $state(false);
	let msg = $state('');
	let status = $state('');

	/** @param {SubmitEvent} e */
	async function onSubmit(e) {
		e.preventDefault();
		try {
			if (username.trim() === '' || emailid.trim() === '' || password.trim() === '') {
				isOpen = true;
				msg = 'All Fields are required';
				status = 'danger';
				return false;
			}

			const response = await fetch('https://api-node.themesbrand.website/auth/signup', {
				method: 'POST',
				body: JSON.stringify({ email: emailid, password: password, username: username }),
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const data = await response.json();

			if (response.ok && data.message === 'success') {
				sessionStorage.setItem('authUser', JSON.stringify(data));
				isOpen = true;
				msg = 'Registration success. Redirecting...';
				status = 'success';
				setTimeout(function () {
					goto('login');
				}, 1500);
			} else {
				isOpen = true;
				msg = 'error';
				status = 'danger';
				const error = data.data || 'An error occurred';
				msg = error;
				return error;
			}
		} catch (error) {
			console.error('Error:', error);
			return 'An error occurred';
		}
	}
</script>

<Headtitle title="Register" />

<div class="account-pages my-5 pt-sm-5">
	<div class="container">
		<div class="row justify-content-center">
			<div class="col-md-8 col-lg-8 col-xl-5">
				<div class="card overflow-hidden">
					<div class="bg-primary-subtle">
						<div class="row">
							<div class="col-7">
								<div class="text-primary p-4">
									<h5 class="text-primary">Free Register</h5>
									<p>Get your free account now.</p>
								</div>
							</div>
							<div class="col-5 align-self-end">
								<img src="images/profile-img.png" alt="" class="img-fluid" />
							</div>
						</div>
					</div>
					<div class="card-body pt-0">
						<div>
							<a href="page/dashboard">
								<div class="avatar-md profile-user-wid mb-4">
									<span class="avatar-title rounded-circle bg-light">
										<img src={PUBLIC_LOGO_URL} alt="" class="rounded-circle" height="34" />
									</span>
								</div>
							</a>
						</div>
						<div class="p-2">
							{#if isOpen}
								<div class="alert alert-{status}" role="alert">{msg}</div>
							{/if}
							<form class="needs-validation" onsubmit={onSubmit}>
								<div class="mb-3">
									<label for="useremail" class="form-label">Email</label>
									<input
										type="email"
										class="form-control"
										id="useremail"
										placeholder="Enter email"
										bind:value={emailid}
									/>
									<div class="invalid-feedback">Please Enter Email</div>
								</div>

								<div class="mb-3">
									<label for="username" class="form-label">Username</label>
									<input
										type="text"
										class="form-control"
										id="username"
										placeholder="Enter username"
										bind:value={username}
									/>
									<div class="invalid-feedback">Please Enter Username</div>
								</div>

								<div class="mb-3">
									<label for="userpassword" class="form-label">Password</label>
									<input
										type="password"
										class="form-control"
										id="userpassword"
										placeholder="Enter password"
										bind:value={password}
									/>
									<div class="invalid-feedback">Please Enter Password</div>
								</div>

								<div class="mt-4 d-grid">
									<button type="submit" class="btn btn-primary waves-effect waves-light">
										Register
									</button>
								</div>

								<div class="mt-4 text-center">
									<h5 class="font-size-14 mb-3">Sign up using</h5>

									<ul class="list-inline">
										<li class="list-inline-item">
											<button type="button" class="social-list-item bg-primary text-white border-primary" aria-label="Sign up with Facebook">
												<i class="mdi mdi-facebook"></i>
											</button>
										</li>
										<li class="list-inline-item">
											<button type="button" class="social-list-item bg-info text-white border-info" aria-label="Sign up with Twitter">
												<i class="mdi mdi-twitter"></i>
											</button>
										</li>
										<li class="list-inline-item">
											<button type="button" class="social-list-item bg-danger text-white border-danger" aria-label="Sign up with Google">
												<i class="mdi mdi-google"></i>
											</button>
										</li>
									</ul>
								</div>

								<div class="mt-4 text-center">
									<p class="mb-0">
										By registering you agree to the <button type="button" class="btn btn-link text-primary p-0 align-baseline">Terms of Use</button>
									</p>
								</div>
							</form>
						</div>
					</div>
				</div>
				<div class="mt-5 text-center">
					<p>
						Already have an account ?
						<a href="login" class="fw-medium text-primary">Login</a>
					</p>
					<p>
						© {new Date().getFullYear()} {PUBLIC_COMPANY_NAME}. Crafted with
						<i class="mdi mdi-heart text-danger"></i> by Open Source community
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
