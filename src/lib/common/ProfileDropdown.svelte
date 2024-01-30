<script>
	import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from '@sveltestrap/sveltestrap';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	/**
	 * @type {{ full_name: any; }}
	 */
	 export let user;
	function logout() {
		if (browser){	
			localStorage.removeItem('user');
		} 
		goto('/');
	};
</script>

<Dropdown class="d-inline-block">
	<DropdownToggle
		tag="a"
		color=""
		class="btn header-item waves-effect"
		id="page-header-user-dropdown"
	>
		<img class="rounded-circle header-profile-user" src='images/users/user-dummy.jpg' alt="Header Avatar" />
		<span class="d-none d-xl-inline-block ms-1" key="t-fullname">{user?.full_name}</span>
		<i class="mdi mdi-chevron-down d-none d-xl-inline-block" />
	</DropdownToggle>
	<DropdownMenu end>
		<!-- item-->
		<DropdownItem href="page/user/me"
			><i class="bx bx-user font-size-16 align-middle me-1" />
			<span>Profile</span>
		</DropdownItem>
		<DropdownItem href="#"
			><span class="badge bg-success float-end">11</span><i
				class="bx bx-wrench font-size-16 align-middle me-1"
			/> <span key="t-settings">Settings</span>
		</DropdownItem>
		<DropdownItem divider />
		<DropdownItem href="#" >
			<div on:click={logout}>
				<i class="bx bx-power-off font-size-16 align-middle me-1 text-danger" /> <span>Logout</span>
			</div>
		</DropdownItem>
	</DropdownMenu>
</Dropdown>
