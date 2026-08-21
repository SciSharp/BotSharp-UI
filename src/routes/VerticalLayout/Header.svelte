<script>
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import LanguageDropdown from '$lib/common/dropdowns/LanguageDropdown.svelte';
	import FullScreenDropdown from '$lib/common/dropdowns/FullScreenDropdown.svelte';
	import NotificationDropdown from '$lib/common/dropdowns/NotificationDropdown.svelte';
	import ProfileDropdown from '$lib/common/dropdowns/ProfileDropdown.svelte';
	import { OverlayScrollbars } from 'overlayscrollbars';
	import { PUBLIC_LOGO_URL } from '$env/static/public';
	import { globalEventStore, getTenantName } from '$lib/helpers/store';
	import { GlobalEvent } from '$lib/helpers/enums';

	/**
	 * @type {{
	 *   user?: any,
	 *   toggleRightBar?: () => void
	 * }}
	 */
	let {
		user = undefined
	} = $props();

	let searchText = $state('');
	let tenantName = $state('');

	onMount(() => {
		tenantName = getTenantName();
		const handler = (/** @type {any} */ e) => {
			tenantName = e?.detail?.tenantName || getTenantName() || '';
		};
		window.addEventListener('tenantChanged', handler);
		return () => window.removeEventListener('tenantChanged', handler);
	});

	const toggleSideBar = () => {
		if (browser) {
			document.body.classList.toggle('sidebar-enable');
			document.body.classList.toggle('vertical-collpsed');

			if (document.body.classList.contains('vertical-collpsed')) {
				const menuElement = document.querySelector('#vertical-menu');
				if (menuElement) {
					// @ts-ignore
					const instance = OverlayScrollbars(menuElement);
					if (instance) {
						instance.destroy();
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
	};

	/** @param {KeyboardEvent} e */
	const search = (e) => {
		if (e.key !== 'Enter') return;

		globalEventStore.set({ name: GlobalEvent.Search, payload: searchText });
	};
</script>

<header
	id="page-topbar"
	class="fixed inset-x-0 top-0 z-[1002] h-[var(--header-height)] bg-white shadow-sm dark:bg-gray-800"
>
	<div class="mx-auto flex h-full items-center justify-between pr-2">
		<div class="flex items-center">
			<!-- LOGO -->
			<div class="flex h-[var(--header-height)] w-auto shrink-0 items-center justify-center px-3 transition-[width] duration-200 lg:w-[var(--sidebar-width)] lg:px-6 vertical-collpsed:lg:w-[var(--sidebar-collapsed-width)] vertical-collpsed:lg:px-2">
				<a href="page/dashboard" aria-label="Home" class="block">
					<img
						src={PUBLIC_LOGO_URL}
						alt=""
						class="h-[38px] w-auto max-w-full vertical-collpsed:h-[22px]"
					/>
				</a>
			</div>

			<button
				type="button"
				class="ml-1 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded text-base text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
				id="vertical-menu-btn"
				aria-label="Toggle sidebar"
				onclick={() => toggleSideBar()}
			>
				<i class="fa fa-fw fa-bars"></i>
			</button>

			<!-- App Search-->
			<form class="ml-2 hidden lg:block">
				<div class="relative">
					<input
						type="text"
						class="h-9 w-60 rounded border border-transparent bg-[#f3f3f9] py-1 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-700 dark:text-gray-100 font-sans"
						placeholder="{$_('Search')}..."
						maxlength={500}
						bind:value={searchText}
						onkeydown={e => search(e)}
					/>
					<span class="bx bx-search-alt absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400"></span>
				</div>
			</form>
		</div>
		<div class="flex items-center">
			{#if tenantName}
				<span class="mx-2 hidden self-center text-sm text-muted sm:inline">Tenant: {tenantName}</span>
			{/if}
			<LanguageDropdown />
			<FullScreenDropdown />
			<NotificationDropdown />
			<ProfileDropdown {user} />
		</div>
	</div>
</header>


