<script>
	import RightSidebar from '$lib/common/RightSidebar.svelte';
	import Header from './Header.svelte';
	import Sidebar from './Sidebar.svelte';
	import { browser } from '$app/environment';
	import Footer from './Footer.svelte';
	import { onMount } from 'svelte';
	import { getPluginMenu } from '$lib/services/plugin-service';
	import { myInfo } from '$lib/services/auth-service';

	/** @type {import('$pluginTypes').PluginMenuDefModel[]} */
	let menu;
	/**
	 * @type {import("$userTypes").UserModel}
	 */
	let user;

	const toggleRightBar = () => {
		if (browser) {
			if (document.body.classList.contains('right-bar-enabled')) {
				document.body.classList.remove('right-bar-enabled');
			} else {
				document.body.classList.add('right-bar-enabled');
			}
		}
	};

	let closebar = () => {
		toggleRightBar();
	};

	onMount(async () => {
		menu = await getPluginMenu();
		user = await myInfo();
		if (browser) {
			document.body.setAttribute('data-layout', 'vertical');
		}
	});
</script>

<div id="layout-wrapper">
	<Header user={user} {toggleRightBar} />
	{#if menu}
	<Sidebar menu={menu}/>
	{/if}
	<div class="main-content">
		<div class="page-content">
			<div class="container-fluid">
				<slot />
			</div>
		</div>
		<Footer />
	</div>

	<RightSidebar {closebar} />
</div>
