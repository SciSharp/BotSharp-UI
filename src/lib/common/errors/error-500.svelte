<script>
	import { goto } from '$app/navigation';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';

	function goBack() {
		if (typeof history !== 'undefined' && history.length > 1) {
			history.back();
		} else {
			goto('/page/dashboard');
		}
	}
</script>

<HeadTitle title="500 Error Page" />

<div class="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-12">
	<!-- Soft animated backdrop blobs -->
	<div class="pointer-events-none absolute inset-0 -z-10">
		<div class="err-blob absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_25%,transparent)] blur-3xl"></div>
		<div class="err-blob err-blob-delayed absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--color-danger)_22%,transparent)] blur-3xl"></div>
	</div>

	<div class="w-full max-w-2xl text-center">
		<!-- 5 [spin] 0 -->
		<h1 class="flex items-center justify-center gap-3 text-7xl font-medium tracking-tight text-gray-900 sm:text-8xl dark:text-gray-100">
			<span>5</span>
			<span class="text-[var(--color-primary)]">
				<i class="bx bx-buoy bx-spin"></i>
			</span>
			<span>0</span>
		</h1>

		<h4 class="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-gray-700 sm:text-base dark:text-gray-200">
			Internal Server Error
		</h4>

		<p class="mx-auto mt-4 max-w-md text-sm text-[var(--color-muted)] sm:text-base">
			Something broke on our end. Hang tight while we work on it — try again in a moment, or head back home.
		</p>

		<!-- Illustration -->
		<div class="mt-8 mb-8">
			<img
				src="images/error-img.png"
				alt=""
				class="mx-auto w-full max-w-sm err-float"
			/>
		</div>

		<!-- Actions -->
		<div class="mt-6 flex flex-wrap justify-center gap-3">
			<button
				class="err-btn err-btn-primary"
				onclick={() => goto('/page/dashboard')}
			>
				<i class="bx bx-home-alt"></i>
				Back to Dashboard
			</button>
			<button
				class="err-btn err-btn-ghost"
				onclick={() => goBack()}
			>
				<i class="bx bx-arrow-back"></i>
				Go Back
			</button>
		</div>
	</div>
</div>

<style>
	/* Image float animation */
	.err-float {
		animation: err-float-anim 6s ease-in-out infinite;
	}
	@keyframes err-float-anim {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-12px); }
	}

	/* Backdrop blob drift */
	.err-blob {
		animation: err-blob-anim 14s ease-in-out infinite;
	}
	.err-blob-delayed {
		animation-delay: -7s;
	}
	@keyframes err-blob-anim {
		0%, 100% { transform: translate(0, 0) scale(1); }
		50% { transform: translate(20px, -20px) scale(1.08); }
	}

	/* Buttons */
	.err-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		height: 2.5rem;
		padding: 0 1.25rem;
		border: 1px solid transparent;
		border-radius: 0.625rem;
		font-size: 0.875rem;
		font-weight: 500;
		line-height: 1;
		cursor: pointer;
		transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
	}
	.err-btn:active {
		transform: translateY(1px);
	}
	.err-btn i {
		font-size: 1.125rem;
		line-height: 1;
	}
	.err-btn-primary {
		background-color: var(--color-primary);
		color: rgb(255 255 255);
		box-shadow:
			0 1px 2px rgb(15 23 42 / 0.1),
			0 8px 24px -8px color-mix(in srgb, var(--color-primary) 60%, transparent);
	}
	.err-btn-primary:hover {
		background-color: var(--color-primary-hover);
		box-shadow:
			0 1px 2px rgb(15 23 42 / 0.1),
			0 12px 28px -8px color-mix(in srgb, var(--color-primary) 70%, transparent);
	}
	.err-btn-ghost {
		background-color: rgb(255 255 255);
		border-color: rgb(229 231 235);
		color: rgb(55 65 81);
	}
	.err-btn-ghost:hover {
		background-color: rgb(249 250 251);
		border-color: rgb(209 213 219);
	}
	:global(.dark) .err-btn-ghost {
		background-color: rgb(31 41 55);
		border-color: rgb(55 65 81);
		color: rgb(229 231 235);
	}
	:global(.dark) .err-btn-ghost:hover {
		background-color: rgb(55 65 81);
		border-color: rgb(75 85 99);
	}
</style>
