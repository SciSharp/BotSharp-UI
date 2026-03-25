<script>
	import { onMount } from 'svelte';
	import { PUBLIC_BRAND_NAME } from '$env/static/public';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import FileDropZone from '$lib/common/files/FileDropZone.svelte';
	import { myInfo, uploadUserAvatar } from '$lib/services/auth-service';
	import { _ } from 'svelte-i18n';
	import { userStore } from '$lib/helpers/store';
	import { PUBLIC_SERVICE_URL } from '$env/static/public';
	import { buildUrl } from '$lib/helpers/utils/common';

	/** @type {import('$userTypes').UserModel} */
	let currentUser = $state(/** @type {any} */ (undefined));

	const fileMaxSize = 10 * 1024 * 1024;

	onMount(async () => {
		await myInfo()
			.then((data) => {
				currentUser = data;
			});
	});

	/** @param {any} e */
	async function handleFileDrop(e) {
		const { acceptedFiles } = e;
		const file = acceptedFiles[0];
		if (!file) return;

		await uploadUserAvatar(file);
		window.location.reload();
	}

	/** @param {any} e */
	function handleAvatarLoad(e) {
		e.target.src = 'images/users/user-dummy.jpg';
	}
</script>

<HeadTitle title={$_('My Profile')} />
<Breadcrumb title={$_('Home')} pagetitle={$_('My Profile')} />
<div class="row">
	<div class="col-xl-4">
		<div class="card overflow-hidden">
			<div class="bg-primary-subtle">
				<div class="row">
					<div class="col-7">
						<div class="text-primary p-3">
							<h5 class="text-primary">{$_('Welcome Back !')}</h5>
							<p>{PUBLIC_BRAND_NAME}</p>
						</div>
					</div>
				</div>
			</div>
			<div class="card-body pt-0">
				<div class="row">
					<div class="col-sm-4">
						<div class="avatar-md profile-user-wid mb-4">
							<FileDropZone
								accept="image/*"
								disableDefaultStyles
								containerStyles={'width: 100%; height: 100%;'}
								noDrag
								multiple={false}
								fileLimit={1}
								maxSize={fileMaxSize}
								ondrop={handleFileDrop}
							>
								<img
									src={`${currentUser?.avatar && $userStore?.token ?
										`${buildUrl(PUBLIC_SERVICE_URL, currentUser?.avatar).href}?access_token=${$userStore?.token}` : ''}`}
									alt=""
									class="img-thumbnail rounded-circle"
									style="width: 100%; height: 100%;"
									onerror={e => handleAvatarLoad(e)}
								/>
							</FileDropZone>
						</div>
						<h5 class="font-size-15 text-truncate">{currentUser?.full_name}</h5>
						<p class="text-muted mb-0 text-truncate">{currentUser?.role ?? 'Role: N/A'}</p>
					</div>
				</div>
			</div>
		</div>
		<div class="card">
			<div class="card-body">
				<h4 class="card-title mb-4">{$_('Personal Information')}</h4>
				<div class="table-responsive">
					<table class="table">
						<tbody>
							<tr>
								<th>{$_('First Name')}:</th>
								<td>
									{currentUser?.first_name ?? 'N/A'}
								</td>
							</tr>
							<tr>
								<th>{$_('Last Name')}:</th>
								<td>
									{currentUser?.last_name ?? 'N/A'}
								</td>
							</tr>
							<tr>
								<th>{$_('Email')}:</th>
								<td>
									{currentUser?.email ?? 'N/A'}
								</td>
							</tr>
							<tr>
								<th>{$_('Account Origin')}:</th>
								<td>
									{currentUser?.source} {currentUser?.external_id ?? 'N/A'}
								</td>
							</tr>
							<tr>
								<th>{$_('Update Date')}:</th>
								<td>
									{currentUser?.update_date
										? new Date(currentUser?.update_date).toLocaleString()
										: 'N/A'}
								</td>
							</tr>
							<tr>
								<th>{$_('Create Date')}:</th>
								<td>
									{currentUser?.create_date
										? new Date(currentUser?.create_date).toLocaleString()
										: 'N/A'}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>
</div>
