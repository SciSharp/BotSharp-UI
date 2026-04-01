<script>
	import Headtitle from '$lib/common/shared/HeadTitle.svelte';
	import { PUBLIC_LOGO_URL, PUBLIC_COMPANY_NAME } from '$env/static/public';
</script>

<Headtitle title="Recover Password" />

<div class="account-pages my-5 pt-sm-5">
	<div class="container">
		<div class="row justify-content-center">
			<div class="col-md-8 col-lg-6 col-xl-5">
				<div class="card overflow-hidden">
					<div class="bg-primary-subtle">
						<div class="row">
							<div class="col-7">
								<div class="text-primary p-4">
									<h5 class="text-primary">Reset Password</h5>
									<p>Reset Password with SciSharp.</p>
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
							<div class="alert alert-success text-center mb-4" role="alert">
								Enter your Email and instructions will be sent to you!
							</div>

							<form class="form-horizontal" action="page/dashboard">
								<div class="mb-3">
									<label for="useremail" class="form-label">Email</label>
									<input
										type="email"
										class="form-control"
										id="useremail"
										placeholder="Enter email"
									/>
								</div>

								<div class="text-end">
									<button type="submit" class="btn btn-primary w-md waves-effect waves-light">
										Reset
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
				<div class="mt-5 text-center">
					<p>
						Remember It ?
						<a href="login" class="fw-medium text-primary">Sign In here</a>
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
