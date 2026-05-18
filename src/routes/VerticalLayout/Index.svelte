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

	let { children } = $props();

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
		<div class="page-content pt-[calc(var(--header-height)+1.5rem)] pb-[var(--footer-height)] px-3 sm:px-4 lg:px-6 min-h-screen">
			<div class="relative mx-auto w-full max-w-full">
				<LoadingToComplete
					spinnerSize={50}
					{isLoading}
					isError={hasError}
				/>
				{@render children?.()}
			</div>
		</div>
		<Footer />
	</div>

	<RightSidebar closebar={() => closebar()} />
</div>


