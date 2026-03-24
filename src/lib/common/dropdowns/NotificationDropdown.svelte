<script>
	import { onMount } from 'svelte';
	import "overlayscrollbars/overlayscrollbars.css";
	import { OverlayScrollbars } from "overlayscrollbars";
	import { _ } from 'svelte-i18n';
	import { clickoutsideDirective } from '$lib/helpers/directives';

	let isOpen = $state(false);

	const options = {
		scrollbars: {
			visibility: "auto",
			autoHide: "move",
			autoHideDelay: 100,
			dragScroll: true,
			clickScroll: false,
			theme: "os-theme-light",
			pointers: ["mouse", "touch", "pen"],
		},
	};

	/** @param {any} e */
	function handleClickOutside(e) {
		const curNode = e.detail.currentNode;
		const targetNode = e.detail.targetNode;
		if (!curNode?.contains(targetNode)) {
			isOpen = false;
		}
	}

	onMount(() => {
		const menuElement = document.querySelector("#notification");
		// @ts-ignore
		OverlayScrollbars(menuElement, options);
	});
</script>

<div
	class="dropdown d-none d-lg-inline-block"
	use:clickoutsideDirective
	onclickoutside={handleClickOutside}
>
	<button
		type="button"
		class="btn header-item noti-icon waves-effect"
		aria-label="Notifications"
		onclick={() => (isOpen = !isOpen)}
	>
		<i class="bx bx-bell bx-tada"></i>
		<span class="badge bg-danger rounded-pill">1</span>
	</button>
	<div class="dropdown-menu dropdown-menu-lg dropdown-menu-end" class:show={isOpen}>
		<div class="p-3">
			<div class="row align-items-center">
				<div class="col">
					<h6 class="m-0">{$_('Notifications')}</h6>
				</div>
				<div class="col-auto">
					<span class="small text-muted">{$_('View All')}</span>
				</div>
			</div>
		</div>
		<div style="max-height: 230px;" id="notification">
			<div class="text-reset notification-item d-block p-2">
				<div class="d-flex">
					<div class="avatar-xs me-3">
						<span class="avatar-title bg-primary rounded-circle font-size-16">
							<i class="bx bx-cart"></i>
						</span>
					</div>
					<div class="flex-grow-1">
						<h6 class="mb-1">{$_('Your order is placed')}</h6>
						<div class="font-size-12 text-muted">
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
</div>
