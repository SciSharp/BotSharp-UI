<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import RightSidebar from '$lib/common/shared/RightSidebar.svelte';
	import { getPluginMenu } from '$lib/services/plugin-service';
	import { myInfo } from '$lib/services/auth-service';
	import { globalMenuStore } from '$lib/helpers/store';
	import { getCleanUrl } from '$lib/helpers/utils/common';
	import { isDesktop } from '$lib/services/simpleclaw-service';
	import { SIMPLECLAW_ROUTE } from '$lib/helpers/constants/simpleclaw';
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

	// Features that only work in the desktop shell. The backend serves one menu to both
	// builds, so the web build has to drop these itself rather than show a dead entry.
	// A second such feature should turn this into a lookup, not another condition.
	const DESKTOP_ONLY_ROUTES = [SIMPLECLAW_ROUTE];

	/** @param {import('$pluginTypes').PluginMenuDefModel[]} items */
	function applyPlatformVisibility(items) {
		if (isDesktop()) return items;
		return (items || []).filter((x) => !DESKTOP_ONLY_ROUTES.includes(getCleanUrl(x.link)));
	}

	onMount(async () => {
		menu = applyPlatformVisibility(await getPluginMenu());
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


