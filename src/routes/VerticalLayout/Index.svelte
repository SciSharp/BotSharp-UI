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
	import Footer from './Footer.svelte';

	/**
	 * Both flags are opt-outs for pages that own their own viewport.
	 *
	 * `footer` — a credit line pinned under a full-height chat thread reads as part of
	 * the conversation.
	 *
	 * `loader` — the global spinner covers the page on every request. A page that shows
	 * progress inline (a typing indicator, a live run card) would have that hidden behind
	 * an overlay saying only "something is happening". Errors are unaffected; the toast
	 * comes from the same component and stays on.
	 *
	 * @type {{ children?: import('svelte').Snippet, footer?: boolean, loader?: boolean }}
	 */
	let { children, footer = true, loader = true } = $props();

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
		<div
			class="page-content pt-[calc(var(--header-height)+1.5rem)] px-3 sm:px-4 lg:px-6 min-h-screen {footer
				? 'pb-[var(--footer-height)]'
				: ''}"
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
		{#if footer}
			<Footer />
		{/if}
	</div>

	<RightSidebar closebar={() => closebar()} />
</div>


