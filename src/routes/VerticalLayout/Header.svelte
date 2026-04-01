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
		user = undefined,
		toggleRightBar = () => {}
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

<header id="page-topbar">
	<div class="navbar-header">
		<div class="d-flex align-items-center">
			<!-- LOGO -->
			<div class="navbar-brand-box">
				<a href="page/dashboard" class="logo logo-dark">
					<span class="logo-sm">
						<img src={PUBLIC_LOGO_URL} alt="" height="22" style="max-height: 22px; width: auto;" />
					</span>
					<span class="logo-lg">
						<img src={PUBLIC_LOGO_URL} alt="" height="38" style="max-height: 38px; width: auto;" />
					</span>
				</a>

				<a href="page/dashboard" class="logo logo-light">
					<span class="logo-sm">
						<img src={PUBLIC_LOGO_URL} alt="" height="22" style="max-height: 22px; width: auto;" />
					</span>
					<span class="logo-lg">
						<img src={PUBLIC_LOGO_URL} alt="" height="38" style="max-height: 38px; width: auto;" />
					</span>
				</a>
			</div>

			<button
				type="button"
				class="btn btn-sm px-3 font-size-16 header-item waves-effect"
				id="vertical-menu-btn"
				aria-label="Toggle sidebar"
				onclick={() => toggleSideBar()}
			>
				<i class="fa fa-fw fa-bars"></i>
			</button>

			<!-- App Search-->
			<form class="app-search d-none d-lg-block">
				<div class="position-relative">
					<input
						type="text"
						class="form-control"
						placeholder="{$_('Search')}..."
						maxlength={500}
						bind:value={searchText}
						onkeydown={e => search(e)}
					/>
					<span class="bx bx-search-alt"></span>
				</div>
			</form>
		</div>
		<div class="d-flex align-items-center">
			{#if tenantName}
				<span class="ms-2 me-2 align-self-center text-muted">Tenant: {tenantName}</span>
			{/if}
			<LanguageDropdown />
			<FullScreenDropdown />
			<NotificationDropdown />
			<ProfileDropdown {user} />
		</div>
	</div>
</header>
