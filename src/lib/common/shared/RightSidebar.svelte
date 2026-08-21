<script>
	import 'overlayscrollbars/overlayscrollbars.css';
	import { OverlayScrollbars } from 'overlayscrollbars';
	import { onMount } from 'svelte';

	/**
	 * @type {{
	 *   sidebarColor?: string,
	 *   topbarColor?: string,
	 *   layoutWidth?: string,
	 *   layoutMode?: string,
	 *   sidebarSize?: string,
	 *   closebar: () => void
	 * }}
	 */
	let {
		sidebarColor = 'dark',
		topbarColor = 'light',
		layoutWidth = 'fluid',
		layoutMode = 'light',
		sidebarSize = 'icon',
		closebar
	} = $props();

	const options = {
		scrollbars: {
			visibility: 'auto', // You can adjust the visibility ('auto', 'hidden', 'visible')
			autoHide: 'move', // You can adjust the auto-hide behavior ('move', 'scroll', false)
			autoHideDelay: 100,
			dragScroll: true,
			clickScroll: false,
			theme: 'os-theme-dark',
			pointers: ['mouse', 'touch', 'pen']
		}
	};

	/**
	 * @param {string} attribute
	 * @param {string} value
	 */
	function changeBodyAttribute(attribute, value) {
		if (document.body) document.body.setAttribute(attribute, value);

		if(attribute == "data-sidebar-size"){
			if(value == "icon"){
				document.body.classList.add('vertical-collpsed');
			}else{
				document.body.classList.remove('vertical-collpsed');
			}

			if (document.body.classList.contains('vertical-collpsed')) {
			if (document.querySelector('#vertical-menu')) {
				// @ts-ignore
				const Instance = OverlayScrollbars(document.querySelector('#vertical-menu'));
				if (Instance) {
					Instance.destroy();
				}
			}
		} else {
			const options = {
				scrollbars: {
					visibility: 'auto',
					autoHide: 'move',
					autoHideDelay: 100,
					dragScroll: true,
					clickScroll: false,
					theme: 'os-theme-light',
					pointers: ['mouse', 'touch', 'pen']
				}
			};
			const menuElement = document.querySelector('#vertical-menu');
			if (menuElement) {
				// @ts-ignore
				OverlayScrollbars(menuElement, options);
			}
		}
		}
	}

	/**
	 * @param {string} attribute
	 * @param {string} value
	 */
	function changeLayoutMode(attribute, value) {
		if (document.documentElement) document.documentElement.setAttribute(attribute, value);
	}

	/**
	 * @param {string} attribute
	 * @param {string} value
	 */
	function changeLayoutwidth(attribute, value) {
		if (document.body) document.body.setAttribute(attribute, value);
		if (value == 'boxed') {
			document.body.classList.add('vertical-collpsed');
		} else {
			document.body.classList.remove('vertical-collpsed');
		}

		if (document.body.classList.contains('vertical-collpsed')) {
			if (document.querySelector('#vertical-menu')) {
				// @ts-ignore
				const Instance = OverlayScrollbars(document.querySelector('#vertical-menu'));
				if (Instance) {
					Instance.destroy();
				}
			}
		} else {
			const options = {
				scrollbars: {
					visibility: 'auto',
					autoHide: 'move',
					autoHideDelay: 100,
					dragScroll: true,
					clickScroll: false,
					theme: 'os-theme-light',
					pointers: ['mouse', 'touch', 'pen']
				}
			};
			const menuElement = document.querySelector('#vertical-menu');
			if (menuElement) {
				// @ts-ignore
				OverlayScrollbars(menuElement, options);
			}
		}
	}

	onMount(() => {
		const menuElement = document.querySelector('#right-bar');
		// @ts-ignore
		OverlayScrollbars(menuElement, options);

		changeBodyAttribute('data-sidebar', sidebarColor);
		changeBodyAttribute('data-topbar', topbarColor);
		changeBodyAttribute('data-sidebar-size', sidebarSize);
		changeLayoutwidth('data-layout-size', layoutWidth);
		changeLayoutMode('data-bs-theme', layoutMode);
		setTimeout(() => {
			if (document.body.getAttribute('data-layout') == 'horizontal') {
				// @ts-ignore
				document.getElementById('sidebaroption').style.display = 'none';
			} else {
				// @ts-ignore
				document.getElementById('sidebaroption').style.display = 'block';
			}
		}, 500);
	});
</script>

<div
	class="right-bar fixed bottom-0 top-0 right-[calc(-1*(var(--rightbar-width)+10px))] z-[9999] w-full max-w-[var(--rightbar-width)] overflow-y-auto bg-white shadow-2xl transition-[right] duration-200 dark:bg-gray-800"
>
	<div class="h-full" id="right-bar">
		<div class="flex items-center px-3 py-4">
			<h5 class="m-0 me-2 text-base font-semibold text-dark dark:text-gray-100">Settings</h5>
			<!-- svelte-ignore a11y_invalid_attribute -->
			<a
				href="javascript:void(0);"
				class="ms-auto inline-flex h-6 w-6 items-center justify-center rounded-full bg-dark text-center text-gray-200 transition-colors hover:bg-black"
				aria-label="Close settings"
				onclick={closebar}
			>
				<i class="mdi mdi-close text-base"></i>
			</a>
		</div>

		{#snippet radioOption(name, id, label, checked, onChange)}
			<div class="mb-3 flex items-center gap-2 last:mb-0">
				<input
					class="theme-choice h-4 w-4 cursor-pointer accent-primary"
					type="radio"
					{name}
					{id}
					{checked}
					onchange={onChange}
				/>
				<label class="cursor-pointer text-sm text-dark dark:text-gray-200" for={id}>{label}</label>
			</div>
		{/snippet}

		<!-- Sidebar Color -->
		<div class="p-4" id="sidebaroption">
			<h6 class="mb-3 text-sm font-semibold text-dark dark:text-gray-100">Sidebar Color</h6>
			<hr class="mb-3 mt-0 border-gray-200 dark:border-gray-700" />
			{@render radioOption('sidebar-color', 'sidebar-color-light', 'Light', sidebarColor == 'light', () => changeBodyAttribute('data-sidebar', 'light'))}
			{@render radioOption('sidebar-color', 'sidebar-color-dark', 'Dark', sidebarColor == 'dark', () => changeBodyAttribute('data-sidebar', 'dark'))}
			{@render radioOption('sidebar-color', 'sidebar-color-colored', 'Colored', sidebarColor == 'colored', () => changeBodyAttribute('data-sidebar', 'colored'))}
		</div>

		<!-- Sidebar Size -->
		<div class="p-4" id="sidebarsizeoption">
			<h6 class="mb-3 text-sm font-semibold text-dark dark:text-gray-100">Sidebar Size</h6>
			<hr class="mb-3 mt-0 border-gray-200 dark:border-gray-700" />
			{@render radioOption('sidebar-size', 'sidebar-size-fluid', 'Fluid', sidebarSize == 'fluid', () => changeBodyAttribute('data-sidebar-size', 'fluid'))}
			{@render radioOption('sidebar-size', 'sidebar-size-small', 'Compact', sidebarSize == 'small', () => changeBodyAttribute('data-sidebar-size', 'small'))}
			{@render radioOption('sidebar-size', 'sidebar-size-icon', 'Icon', sidebarSize == 'icon', () => changeBodyAttribute('data-sidebar-size', 'icon'))}
		</div>

		<!-- Topbar Theme -->
		<div class="p-4">
			<h6 class="mb-3 text-sm font-semibold text-dark dark:text-gray-100">Topbar Theme</h6>
			<hr class="mb-3 mt-0 border-gray-200 dark:border-gray-700" />
			{@render radioOption('topbar-color', 'topbar-color-light', 'Light', topbarColor == 'light', () => changeBodyAttribute('data-topbar', 'light'))}
			{@render radioOption('topbar-color', 'topbar-color-dark', 'Dark', topbarColor == 'dark', () => changeBodyAttribute('data-topbar', 'dark'))}
		</div>

		<!-- Layout Width -->
		<div class="p-4">
			<h6 class="mb-3 text-sm font-semibold text-dark dark:text-gray-100">Layout Width</h6>
			<hr class="mb-3 mt-0 border-gray-200 dark:border-gray-700" />
			{@render radioOption('layout-width', 'layout-width-fluid', 'Fluid', layoutWidth == 'fluid', () => changeLayoutwidth('data-layout-size', 'fluid'))}
			{@render radioOption('layout-width', 'layout-width-boxed', 'Boxed', layoutWidth == 'boxed', () => changeLayoutwidth('data-layout-size', 'boxed'))}
			{@render radioOption('layout-width', 'layout-width-scrollable', 'Scrollable', layoutWidth == 'scrollable', () => changeLayoutwidth('data-layout-scrollable', 'true'))}
		</div>

		<!-- Layout Mode -->
		<hr class="mx-4 mt-0 border-gray-200 dark:border-gray-700" />
		<h6 class="mb-0 text-center text-sm font-semibold text-dark dark:text-gray-100">Choose Layouts</h6>

		<div class="p-4">
			<div class="mb-2">
				<img src="images/layouts/layout-1.jpg" class="block w-full rounded border border-gray-200 p-1 dark:border-gray-700" alt="layout images" />
			</div>
			{@render radioOption('layout-mode', 'layout-mode-light', 'Light', layoutMode == 'light', () => changeLayoutMode('data-bs-theme', 'light'))}

			<div class="mb-2 mt-3">
				<img src="images/layouts/layout-2.jpg" class="block w-full rounded border border-gray-200 p-1 dark:border-gray-700" alt="layout images" />
			</div>
			{@render radioOption('layout-mode', 'layout-mode-dark', 'Dark', layoutMode == 'dark', () => changeLayoutMode('data-bs-theme', 'dark'))}
		</div>
	</div>
</div>

<!-- Right bar overlay -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="rightbar-overlay fixed inset-0 z-[9998] hidden bg-black/55" onclick={closebar}></div>
