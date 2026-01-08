<script>
	import { onMount } from 'svelte';
	import { PUBLIC_BRAND_NAME } from '$env/static/public';
	import { Row, Col, Card, CardBody, CardTitle, Table } from '@sveltestrap/sveltestrap';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import FileDropZone from '$lib/common/files/FileDropZone.svelte';
	import { myInfo, uploadUserAvatar } from '$lib/services/auth-service';
	import { _ } from 'svelte-i18n';
	import { userStore } from '$lib/helpers/store';
	import { PUBLIC_SERVICE_URL } from '$env/static/public';
	import { buildUrl } from '$lib/helpers/utils/common';
	
	/** @type {import('$userTypes').UserModel} */
	let currentUser;
	let isLoading = false;

	const fileMaxSize = 10 * 1024 * 1024;

	onMount(async () => {
		isLoading = true;
		await myInfo()
			.then((data) => {
				currentUser = data;
			})
			.finally(() => {
				isLoading = false;
			});
	});

	/** @param {any} e */
    async function handleFileDrop(e) {
        const { acceptedFiles } = e.detail;
		const file = acceptedFiles[0];
		if (!!!file) return;

		await uploadUserAvatar(file);
		window.location.reload();
    }

	/** @param {any} e */
	function handleAvatarLoad(e) {
		e.target.src = 'images/users/user-dummy.jpg';
	}
</script>

<HeadTitle title="{$_('My Profile')}" />
<Breadcrumb title="{$_('Home')}" pagetitle="{$_('My Profile')}" />
<Row>
	<Col xl={4}>
		<Card class="overflow-hidden">
			<div class="bg-primary-subtle">
				<Row class="row">
					<Col xs={7}>
						<div class="text-primary p-3">
							<h5 class="text-primary">{$_('Welcome Back !')}</h5>
							<p>{PUBLIC_BRAND_NAME}</p>
						</div>
					</Col>
				</Row>
			</div>
			<CardBody class="pt-0">
				<Row>
					<Col sm={4}>
						<div class="avatar-md profile-user-wid mb-4">
							<FileDropZone
								accept="image/*"
								disableDefaultStyles
								containerStyles={'width: 100%; height: 100%;'}
								noDrag
								multiple={false}
								fileLimit={1}
								maxSize={fileMaxSize}
								on:drop={e => handleFileDrop(e)}
							>
								<img
									src={`${currentUser?.avatar && $userStore?.token ? 
										`${buildUrl(PUBLIC_SERVICE_URL, currentUser?.avatar).href}?access_token=${$userStore?.token}` : ''}`}
									alt=""
									class="img-thumbnail rounded-circle"
									style="width: 100%; height: 100%;"
									on:error={e => handleAvatarLoad(e)}
								/>
							</FileDropZone>
						</div>
						<h5 class="font-size-15 text-truncate">{currentUser?.full_name}</h5>
						<p class="text-muted mb-0 text-truncate">{currentUser?.role ?? 'Role: N/A'}</p>
					</Col>
				</Row>
			</CardBody>
		</Card>
		<Card>
			<CardBody>
				<CardTitle class="mb-4">{$_('Personal Information')}</CardTitle>
				<div class="table-responsive">
					<Table>
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
					</Table>
				</div>
			</CardBody>
		</Card>
	</Col>
</Row>
