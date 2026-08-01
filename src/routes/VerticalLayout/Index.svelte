<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import RightSidebar from '$lib/common/shared/RightSidebar.svelte';
	import { getPluginMenu } from '$lib/services/plugin-service';
	import { myInfo } from '$lib/services/auth-service';
	import { globalMenuStore } from '$lib/helpers/store';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import GlobalHeader from '$lib/common/shared/GlobalHeader.svelte';
	import Header from './Header.svelte';
	import Sidebar from './Sidebar.svelte';

	/**
	 * `loader` is an opt-out for pages that own their own progress reporting: the global
	 * spinner covers the page on every request, so a page that shows progress inline (a
	 * typing indicator, a live run card) would have that hidden behind an overlay saying
	 * only "something is happening". Errors are unaffected; the toast comes from the same
	 * component and stays on.
	 *
	 * The companion `footer` flag is gone with the footer itself — the copyright line now
	 * lives in the desktop status bar (StatusBar.svelte, mounted by the root layout) and
	 * the browser build no longer shows one at all.
	 *
	 * @type {{ children?: import('svelte').Snippet, loader?: boolean }}
	 */
	let { children, loader = true } = $props();

	/** @type {import('$pluginTypes').PluginMenuDefModel[] | undefined} */
	let menu = $state(undefined);

	/** @type {import("$userTypes").UserModel | undefined} */
	let user = $state(undefined);

	let isLoading = $state(false);
	let hasError = $state(false);

	const toggleRightBar = () => {
		if (browser) {
			if (document.body.classList.contains('right-bar-enabled')) {
				document.body.classList.remove('right-bar-enabled');
			} else {
				document.body.classList.add('right-bar-enabled');
			}
		}
	};

	const closebar = () => {
		toggleRightBar();
	};

	// The backend menu is the only source of truth for which entries appear; it already
	// role-gates them, and nothing is filtered client-side.
	//
	// There was a platform filter here that dropped desktop-only routes in the browser build.
	// It existed for a single entry whose page drove a service reachable only from the user's
	// own machine. That page is gone and every remaining entry works in both builds, so the
	// filter had nothing left to hide. Bring it back only for a feature that genuinely cannot
	// work in a browser tab — not for one that merely has a nicer desktop experience.
	onMount(async () => {
		menu = await getPluginMenu();
		globalMenuStore.set(menu || []);
		user = await myInfo();
		if (browser) {
			document.body.setAttribute('data-layout', 'vertical');
		}
	});
</script>

<GlobalHeader bind:isLoading={isLoading} bind:hasError={hasError} />

<div id="layout-wrapper" class="min-h-screen">
	<Header {user} toggleRightBar={() => toggleRightBar()} />
	{#if menu}
		<Sidebar {menu} />
	{/if}
	<div class="main-content relative min-h-screen lg:ml-[var(--sidebar-width)] transition-[margin] duration-200">
		<!-- pb keeps the last row of content clear of the fixed desktop status bar; the
		     token is 0px in the browser, so this costs nothing there. -->
		<div
			class="page-content pt-[calc(var(--header-height)+1.5rem)] px-3 sm:px-4 lg:px-6 pb-[var(--statusbar-height)] min-h-screen"
		>
			<div class="relative mx-auto w-full max-w-full">
				<LoadingToComplete
					spinnerSize={50}
					isLoading={loader && isLoading}
					isError={hasError}
				/>
				{@render children?.()}
			</div>
		</div>
	</div>

	<RightSidebar closebar={() => closebar()} />
</div>


