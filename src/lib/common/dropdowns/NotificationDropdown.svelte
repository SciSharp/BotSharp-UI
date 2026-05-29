<script>
	import { _ } from 'svelte-i18n';
	import { clickoutsideDirective } from '$lib/helpers/directives';

	let isOpen = $state(false);

	/** @param {any} e */
	function handleClickOutside(e) {
		const curNode = e.detail.currentNode;
		const targetNode = e.detail.targetNode;
		if (!curNode?.contains(targetNode)) {
			isOpen = false;
		}
	}
</script>

<div
	class="relative hidden lg:inline-block"
	use:clickoutsideDirective
	onclickoutside={handleClickOutside}
>
	<button
		type="button"
		class="relative inline-flex h-[var(--header-height)] cursor-pointer items-center px-3 text-[22px] text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
		aria-label="Notifications"
		onclick={() => (isOpen = !isOpen)}
	>
		<i class="bx bx-bell bx-tada"></i>
		<span class="absolute right-2 top-3 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium text-white">1</span>
	</button>
	{#if isOpen}
		<div class="absolute right-0 top-full z-[1000] mt-1 w-80 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
			<div class="p-3">
				<div class="flex items-center">
					<h6 class="m-0 text-sm font-semibold text-dark dark:text-gray-100">{$_('Notifications')}</h6>
					<span class="ms-auto text-xs text-muted">{$_('View All')}</span>
				</div>
			</div>
			<div class="max-h-[230px] overflow-y-auto" id="notification">
				<div class="p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
					<div class="flex p-2">
						<div class="me-3 shrink-0">
							<span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
								<i class="bx bx-cart text-base"></i>
							</span>
						</div>
						<div class="grow">
							<h6 class="mb-1 text-sm font-semibold text-dark dark:text-gray-100">{$_('Your order is placed')}</h6>
							<div class="text-xs text-muted">
								<p class="mb-1">{$_('If several languages coalesce the grammar')}</p>
								<p class="mb-0">
									<i class="mdi mdi-clock-outline"></i> <span>3 {$_('min ago')}</span>
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
