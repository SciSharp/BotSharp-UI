<script>
	import { resetStorage } from '$lib/helpers/store';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { userStore } from '$lib/helpers/store';
	import { PUBLIC_SERVICE_URL } from '$env/static/public';
	import { _ } from 'svelte-i18n';
	import { buildUrl } from '$lib/helpers/utils/common';
	import { ChatAction } from '$lib/helpers/enums';
	import { CHAT_FRAME_ID } from '$lib/helpers/constants';
	import { clickoutsideDirective } from '$lib/helpers/directives';

	/** @type {{ user?: any }} */
	let { user } = $props();

	let isOpen = $state(false);

	function logout() {
		if (browser){
			resetStorage(true);
		}

		const chatFrame = document.getElementById(CHAT_FRAME_ID);
		if (chatFrame) {
			// @ts-ignore
			chatFrame.contentWindow.postMessage({ action: ChatAction.Logout }, "*");
		}

		goto('login');
	}

	/** @param {any} e */
	function handleAvatarLoad(e) {
		e.target.src = 'images/users/user-dummy.jpg';
	}

	/** @param {any} e */
	function handleClickOutside(e) {
		const curNode = e.detail.currentNode;
		const targetNode = e.detail.targetNode;
		if (!curNode?.contains(targetNode)) {
			isOpen = false;
		}
	}
</script>

<div
	class="relative inline-block"
	use:clickoutsideDirective
	onclickoutside={handleClickOutside}
>
	<button
		type="button"
		class="inline-flex h-[var(--header-height)] cursor-pointer items-center px-3 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
		id="page-header-user-dropdown"
		aria-label="User menu"
		onclick={() => (isOpen = !isOpen)}
	>
		<img
			class="h-9 w-9 rounded-full bg-gray-100 p-[3px] dark:bg-gray-700"
			src={`${user?.avatar && $userStore?.token ?
				`${buildUrl(PUBLIC_SERVICE_URL, user?.avatar)}?access_token=${$userStore?.token}` : ''}`}
			alt=""
			onerror={handleAvatarLoad}
		/>
		<span class="ms-1 hidden xl:inline-block">{user?.full_name}</span>
		<i class="mdi mdi-chevron-down ms-1 hidden xl:inline-block"></i>
	</button>
	{#if isOpen}
		<div class="absolute right-0 top-full z-[1000] mt-1 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
			<a
				class="flex items-center px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
				href="page/user/me"
			>
				<i class="bx bx-user me-2 align-middle text-base"></i>
				<span>{$_('Profile')}</span>
			</a>
			<button
				type="button"
				class="flex w-full items-center px-4 py-2 text-sm text-gray-400 disabled:cursor-not-allowed dark:text-gray-500"
				disabled
			>
				<i class="bx bx-wrench me-2 align-middle text-base"></i>
				<span>{$_('Settings')}</span>
				<span class="ms-auto rounded-full bg-success px-2 py-0.5 text-xs text-white">11</span>
			</button>
			<div class="my-1 h-px bg-gray-200 dark:bg-gray-700"></div>
			<button
				type="button"
				class="flex w-full cursor-pointer items-center px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
				onclick={() => logout()}
			>
				<i class="bx bx-power-off me-2 align-middle text-base text-danger"></i>
				<span>{$_('Logout')}</span>
			</button>
		</div>
	{/if}
</div>
