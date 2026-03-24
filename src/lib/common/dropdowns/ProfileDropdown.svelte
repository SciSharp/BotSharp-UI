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
	class="dropdown d-inline-block"
	use:clickoutsideDirective
	onclickoutside={handleClickOutside}
>
	<button
		type="button"
		class="btn header-item waves-effect"
		id="page-header-user-dropdown"
		aria-label="User menu"
		onclick={() => (isOpen = !isOpen)}
	>
		<img
			class="rounded-circle header-profile-user"
			src={`${user?.avatar && $userStore?.token ?
				`${buildUrl(PUBLIC_SERVICE_URL, user?.avatar)}?access_token=${$userStore?.token}` : ''}`}
			alt=""
			onerror={handleAvatarLoad}
		/>
		<span class="d-none d-xl-inline-block ms-1">{user?.full_name}</span>
		<i class="mdi mdi-chevron-down d-none d-xl-inline-block"></i>
	</button>
	<div class="dropdown-menu dropdown-menu-end" class:show={isOpen}>
		<!-- item-->
		<a class="dropdown-item" href="page/user/me">
			<i class="bx bx-user font-size-16 align-middle me-1"></i>
			<span>{$_('Profile')}</span>
		</a>
		<button type="button" class="dropdown-item" disabled>
			<span class="badge bg-success float-end">11</span>
			<i class="bx bx-wrench font-size-16 align-middle me-1"></i>
			<span>{$_('Settings')}</span>
		</button>
		<div class="dropdown-divider"></div>
		<button
			type="button"
			class="dropdown-item"
			onclick={() => logout()}
		>
			<i class="bx bx-power-off font-size-16 align-middle me-1 text-danger"></i> <span>{$_('Logout')}</span>
		</button>
	</div>
</div>
