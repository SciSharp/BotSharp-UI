<script>
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { Input } from '@sveltestrap/sveltestrap';
	import LanguageDropdown from '$lib/common/dropdowns/LanguageDropdown.svelte';
	import FullScreenDropdown from '$lib/common/dropdowns/FullScreenDropdown.svelte';
	import NotificationDropdown from '$lib/common/dropdowns/NotificationDropdown.svelte';
	import ProfileDropdown from '$lib/common/dropdowns/ProfileDropdown.svelte';
	import { OverlayScrollbars } from 'overlayscrollbars';
	import { PUBLIC_LOGO_URL } from '$env/static/public';
	import { globalEventStore, getTenantName } from '$lib/helpers/store';
	import { GlobalEvent } from '$lib/helpers/enums';


	/** @type {any} */
	export let user;

	/** @type {() => void} */
	export let toggleRightBar = () => {};

	/** @type {string} */
	let searchText = '';

	/** @type {string} */
    let tenantName = '';

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
					const instance = OverlayScrollbars(menuElement);
					if (instance) {
						instance.destroy();
					}
				}
			} else {
				const options = {
					scrollbars: {
						visibility: 'auto', // You can adjust the visibility ('auto', 'hidden', 'visible')
						autoHide: 'move', // You can adjust the auto-hide behavior ('move', 'scroll', false)
						autoHideDelay: 100,
						dragScroll: true,
						clickScroll: false,
						theme: 'os-theme-light',
						pointers: ['mouse', 'touch', 'pen']
					}
				};
				const menuElement = document.querySelector('#vertical-menu');
				if (menuElement) {
					OverlayScrollbars(menuElement, options);
				}
			}
		}
	};

	/** @param {any} e */
	const search = (e) => {
		if (e.key !== 'Enter') return;

		globalEventStore.set({ name: GlobalEvent.Search, payload: searchText });
	}
</script>

<header id="page-topbar">
	<div class="navbar-header">
		<div class="d-flex">
			<!-- LOGO -->
			<div class="navbar-brand-box">
				<a href="page/dashboard" class="logo logo-dark">
					<span class="logo-sm">
						<img src={PUBLIC_LOGO_URL} alt="" height="25" />
					</span>
					<span class="logo-lg">
						<img src={PUBLIC_LOGO_URL} alt="" height="40" />
					</span>
				</a>

				<a href="page/dashboard" class="logo logo-light">
					<span class="logo-sm">
						<img src={PUBLIC_LOGO_URL} alt="" height="25" />
					</span>
					<span class="logo-lg">
						<img src={PUBLIC_LOGO_URL} alt="" height="40" />
					</span>
				</a>
			</div>

			<button
				type="button"
				class="btn btn-sm px-3 font-size-16 header-item waves-effect"
				id="vertical-menu-btn"
				on:click={() => toggleSideBar()}
			>
				<i class="fa fa-fw fa-bars" />
			</button>

			<!-- App Search-->
			<form class="app-search d-none d-lg-block">
				<div class="position-relative">
					<Input
						type="text"
						class="form-control"
						placeholder="{$_('Search')}..."
						maxlength={500}
						bind:value={searchText}
						on:keydown={e => search(e)}
					/>
					<span class="bx bx-search-alt" />
				</div>
			</form>
		</div>
		<div class="d-flex">
			{#if tenantName}
                <span class="ms-2 me-2 align-self-center text-muted">Tenant: {tenantName}</span>
            {/if}
			<LanguageDropdown />
			<FullScreenDropdown />
			<NotificationDropdown />
			<ProfileDropdown user={user}/>
		</div>
	</div>
</header>
