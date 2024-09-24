<script>
	import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from '@sveltestrap/sveltestrap';
	import { resetLocalStorage } from '$lib/helpers/store';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { userStore } from '$lib/helpers/store';
	import { PUBLIC_SERVICE_URL } from '$env/static/public';
	import { _ } from 'svelte-i18n';
	import { buildUrl } from '$lib/helpers/utils/common';
	
	/** @type {any} */
	export let user;

	function logout() {
		if (browser){	
			resetLocalStorage(true);
		}

		const chatFrame = document.getElementById('chat-frame');
		if (chatFrame) {
			// @ts-ignore
			chatFrame.contentWindow.postMessage({ action: "logout" }, "*");
		}

		goto('login');
	};

	/** @param {any} e */
	function handleAvatarLoad(e) {
		e.target.src = 'images/users/user-dummy.jpg';
	}
</script>

<Dropdown class="d-inline-block">
	<DropdownToggle
		tag="a"
		color=""
		class="btn header-item waves-effect"
		id="page-header-user-dropdown"
	>
		<img
			class="rounded-circle header-profile-user"
			src={`${buildUrl(PUBLIC_SERVICE_URL, user?.avatar)}?access_token=${$userStore?.token}`}
			alt=""
			on:error={e => handleAvatarLoad(e)}
		/>
		<span class="d-none d-xl-inline-block ms-1" key="t-fullname">{user?.full_name}</span>
		<i class="mdi mdi-chevron-down d-none d-xl-inline-block" />
	</DropdownToggle>
	<DropdownMenu end>
		<!-- item-->
		<DropdownItem href="page/user/me">
			<i class="bx bx-user font-size-16 align-middle me-1" />
			<span>{$_('Profile')}</span>
		</DropdownItem>
		<DropdownItem href="#" disabled>
			<span class="badge bg-success float-end">11</span>
			<i class="bx bx-wrench font-size-16 align-middle me-1"/>
			<span key="t-settings">{$_('Settings')}</span>
		</DropdownItem>
		<DropdownItem divider />
		<DropdownItem href="#">
			<div
				role="button"
				tabindex="0"
				on:keydown={() => {}}
				on:click={() => logout()}
			>
				<i class="bx bx-power-off font-size-16 align-middle me-1 text-danger" /> <span>{$_('Logout')}</span>
			</div>
		</DropdownItem>
	</DropdownMenu>
</Dropdown>
