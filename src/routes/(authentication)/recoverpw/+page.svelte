<script>
	import Headtitle from '$lib/common/shared/HeadTitle.svelte';
	import { PUBLIC_LOGO_URL, PUBLIC_COMPANY_NAME } from '$env/static/public';
</script>

<Headtitle title="Recover Password" />

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
								<h2 class="mb-1 text-3xl font-bold drop-shadow-sm">Forgot password?</h2>
								<p class="text-lg opacity-90">No worries — we'll email you reset instructions</p>
							</div>
							<div class="md:ml-8 md:shrink-0">
								<img src="images/profile-img.png" alt="Reset password illustration" class="max-w-[120px] drop-shadow-lg md:max-w-[150px]" />
							</div>
						</div>

						<!-- Form body -->
						<div class="px-6 py-8 md:px-8 md:py-10">
							<!-- Info alert -->
							<div class="mb-6 flex items-center gap-2 rounded-xl bg-info/10 px-4 py-3 text-sm font-medium text-info" role="alert">
								<i class="mdi mdi-information-outline shrink-0 text-base leading-none" aria-hidden="true"></i>
								<span>Enter your email and we'll send instructions to reset your password.</span>
							</div>

							<form action="page/dashboard">
								<!-- Email -->
								<div class="mb-8">
									<label for="useremail" class="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
									<div class="relative">
										<i class="mdi mdi-email-outline pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-xl text-gray-500 dark:text-gray-400" aria-hidden="true"></i>
										<input
											type="email"
											id="useremail"
											class="h-12 w-full rounded-xl border-2 border-gray-200 bg-white pl-[3.25rem] pr-4 text-base text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-70 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
											placeholder="Enter your email"
										/>
									</div>
								</div>

								<!-- Submit -->
								<div class="mb-2 flex justify-center">
									<button
										type="submit"
										class="reset-btn h-14 min-w-[200px] rounded-xl bg-linear-to-br from-primary to-primary-hover px-8 text-lg font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
									>
										<i class="mdi mdi-email-send-outline mr-2"></i>
										Send instructions
									</button>
								</div>
							</form>
						</div>
					</div>

					<!-- Footer -->
					<div class="mt-8 text-center">
						<p class="mb-4 text-sm text-gray-600 dark:text-gray-300">
							Remember your password?
							<a href="login" class="ml-1 font-semibold text-primary transition-colors hover:text-primary-hover hover:underline">
								Sign in
							</a>
						</p>
						<p class="text-xs text-gray-500 dark:text-gray-400">
							© {new Date().getFullYear()} {PUBLIC_COMPANY_NAME}. Crafted with
							<i class="mdi mdi-heart text-danger"></i> by Open Source community
						</p>
					</div>

				</div>
			</div>
		</div>
	</div>
</div>


