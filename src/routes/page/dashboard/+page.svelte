<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { PUBLIC_LOGIN_IMAGE, PUBLIC_BRAND_NAME } from '$env/static/public';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import { getDashboardSettings } from '$lib/services/dashboard-service';
	import { userStore } from '$lib/helpers/store';
	import Conversation from './Conversation.svelte';
	import RadialBarChart from './RadialBarChart.svelte';
	import StackedColumnChart from './StackedColumnChart.svelte';
	import SocialSource from './SocialSource.svelte';
	import Activity from './Activity.svelte';
	import TopSellingProduct from './TopSellingProduct.svelte';

	let user = $state({full_name: "", id: ""});

	/**
	 * @type {import("$lib/helpers/types/userTypes").DashboardModel | undefined}
	 */
	let dashboard_model = $state(undefined);

	onMount(() => {
		const userModelSubscribe = userStore.subscribe((/** @type {{ full_name: string; id: string }} */ value) => {
			user = value;
		});
		loadDashboardComponents();

		return () => {
			userModelSubscribe();
		};
	});

	async function loadDashboardComponents() {
		getDashboardSettings()
		.then(
			response => {
				dashboard_model = response;
			}
		)
		.catch();
	}
</script>

<HeadTitle title={$_('Dashboard')} />

<Breadcrumb title={$_('Home')} pagetitle={$_('Dashboard')} />

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
					<div class="col-5 align-self-end">
						<img src={PUBLIC_LOGIN_IMAGE} alt="" class="img-fluid" />
					</div>
				</div>
			</div>
			<div class="card-body pt-0">
				<div class="row">
					<div class="col-sm-4">
						<div class="avatar-md profile-user-wid mb-4">
							<img src='images/users/user-dummy.jpg' alt="" class="img-thumbnail rounded-circle" />
						</div>
						<h5 class="font-size-15 text-truncate">{user?.full_name}</h5>
						<p class="text-muted mb-0 text-truncate">{$_('Agent Manager')}</p>
					</div>
					<div class="col-sm-8">
						<div class="pt-4">
							<div class="row">
								<div class="col-6">
									<h5 class="font-size-15">125</h5>
									<p class="text-muted mb-0">Conversations</p>
								</div>
								<div class="col-6">
									<h5 class="font-size-15">$1245</h5>
									<p class="text-muted mb-0">{$_('Token Cost')}</p>
								</div>
							</div>
							<div class="mt-4">
								<a href="page/user/me" class="btn btn-primary waves-effect waves-light btn-sm">
									{$_('View Profile')} <i class="mdi mdi-arrow-right ms-1"></i>
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="card">
			<div class="card-body">
				<h4 class="card-title mb-4">{$_('Monthly Cost')}</h4>
				<div class="row">
					<div class="col-sm-6">
						<p class="text-muted">{$_('This month')}</p>
						<h3>$34,252</h3>
						<p class="text-muted">
							<span class="text-success me-2"> 12% <i class="mdi mdi-arrow-up"></i> </span> {$_('From previous period')}
						</p>
						<div class="mt-4">
							<a href={'#'} class="btn btn-primary waves-effect waves-light btn-sm"
								>{$_('View More')} <i class="mdi mdi-arrow-right ms-1"></i></a
							>
						</div>
					</div>
					<div class="col-sm-6">
						<div class="mt-4 mt-sm-0">
							<RadialBarChart chartColor={['--bs-primary']} />
						</div>
					</div>
				</div>
				<p class="text-muted mb-0">{$_('We craft digital, graphic and dimensional thinking.')}</p>
			</div>
		</div>
	</div>
	<div class="col-xl-8">
		<div class="row">
			<div class="col-md-4">
				<div class="card mini-stats-wid">
					<div class="card-body">
						<div class="d-flex">
							<div class="flex-grow-1">
								<p class="text-muted fw-medium">Conversations</p>
								<h4 class="mb-0">1,235</h4>
							</div>
							<div class="flex-shrink-0 align-self-center">
								<div class="mini-stat-icon avatar-sm rounded-circle bg-primary">
									<span class="avatar-title">
										<i class="bx bx-copy-alt font-size-24"></i>
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="col-md-4">
				<div class="card mini-stats-wid">
					<div class="card-body">
						<div class="d-flex">
							<div class="flex-grow-1">
								<p class="text-muted fw-medium">{$_('Total Cost')}</p>
								<h4 class="mb-0">$35, 723</h4>
							</div>
							<div class="flex-shrink-0 align-self-center">
								<div class="mini-stat-icon avatar-sm rounded-circle bg-primary">
									<span class="avatar-title">
										<i class="bx bx-archive-in font-size-24"></i>
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="col-md-4">
				<div class="card mini-stats-wid">
					<div class="card-body">
						<div class="d-flex">
							<div class="flex-grow-1">
								<p class="text-muted fw-medium">{$_('Average Cost')}</p>
								<h4 class="mb-0">$16.2</h4>
							</div>
							<div class="flex-shrink-0 align-self-center">
								<div class="mini-stat-icon avatar-sm rounded-circle bg-primary">
									<span class="avatar-title">
										<i class="bx bx-purchase-tag-alt font-size-24"></i>
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="card">
			<div class="card-body">
				<div class="d-sm-flex flex-wrap">
					<h4 class="card-title mb-4">{$_('Token Spent')}</h4>
					<div class="ms-auto">
						<ul class="nav nav-pills">
							<li class="nav-item">
								<a href={'#'} class="nav-link">{$_('Week')}</a>
							</li>
							<li class="nav-item">
								<a href={'#'} class="nav-link">{$_('Month')}</a>
							</li>
							<li class="nav-item">
								<a href={'#'} class="nav-link active">{$_('Year')}</a>
							</li>
						</ul>
					</div>
				</div>
				<StackedColumnChart chartColor={['--bs-primary', '--bs-warning', '--bs-success']} />
			</div>
		</div>
	</div>
</div>

<div class="row">
	{#each dashboard_model?.conversation_list || [] as conv (conv.conversation_id)}
		{#if conv?.conversation_id}
			<Conversation conversationId={conv.conversation_id} instruction={conv.instruction} userId={user.id}/>
		{/if}
	{/each}
</div>

<div class="row">
	<SocialSource />
	<Activity />
	<TopSellingProduct />
</div>