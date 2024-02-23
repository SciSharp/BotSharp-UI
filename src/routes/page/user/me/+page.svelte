<script>
	import { PUBLIC_BRAND_NAME, PUBLIC_LOGIN_IMAGE } from '$env/static/public';
	import { Row, Col, Card, CardBody, CardTitle, Table } from '@sveltestrap/sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import { onMount } from 'svelte';
	import { myInfo } from '$lib/services/auth-service';
	import { _ } from 'svelte-i18n';

	/** @type {import('$types').UserModel} */
	let currentUser;
	let isLoading = false;
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
							<img
								src="images/users/user-dummy.jpg"
								alt="avatar"
								class="img-thumbnail rounded-circle"
							/>
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
