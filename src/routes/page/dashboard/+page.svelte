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

<div class="-mx-2 flex flex-wrap">
	<div class="w-full xl:w-1/3 px-2">
		<!-- Welcome card -->
		<div class="mb-4 overflow-hidden rounded-md bg-white shadow ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
			<div class="bg-primary/25">
				<div class="flex flex-wrap">
					<div class="w-7/12">
						<div class="p-3 text-primary">
							<h5 class="text-primary">{$_('Welcome Back !')}</h5>
							<p>{PUBLIC_BRAND_NAME}</p>
						</div>
					</div>
					<div class="w-5/12 self-end">
						<img src={PUBLIC_LOGIN_IMAGE} alt="" class="h-auto max-w-full" />
					</div>
				</div>
			</div>
			<div class="px-4 pb-4 pt-0">
				<div class="-mx-2 flex flex-wrap">
					<div class="w-full px-2 sm:w-1/3">
						<div class="mb-4 h-[4.5rem] w-[4.5rem]">
							<img
								src="images/users/user-dummy.jpg"
								alt=""
								class="h-full w-full rounded-full border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-700"
							/>
						</div>
						<h5 class="truncate text-[15px] font-semibold">{user?.full_name}</h5>
						<p class="mb-0 truncate text-muted">{$_('Agent Manager')}</p>
					</div>
					<div class="w-full px-2 sm:w-2/3">
						<div class="pt-4">
							<div class="-mx-2 flex flex-wrap">
								<div class="w-1/2 px-2">
									<h5 class="text-[15px] font-semibold">125</h5>
									<p class="mb-0 text-muted">Conversations</p>
								</div>
								<div class="w-1/2 px-2">
									<h5 class="text-[15px] font-semibold">$1245</h5>
									<p class="mb-0 text-muted">{$_('Token Cost')}</p>
								</div>
							</div>
							<div class="mt-4">
								<a
									href="page/user/me"
									class="inline-flex items-center justify-center rounded bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
								>
									{$_('View Profile')} <i class="mdi mdi-arrow-right ms-1"></i>
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Monthly Cost card -->
		<div class="mb-4 rounded-md bg-white shadow ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
			<div class="p-4">
				<h4 class="mb-4 text-base font-medium text-dark dark:text-gray-100">{$_('Monthly Cost')}</h4>
				<div class="-mx-2 flex flex-wrap">
					<div class="w-full px-2 sm:w-1/2">
						<p class="text-muted">{$_('This month')}</p>
						<h3 class="text-2xl font-semibold">$34,252</h3>
						<p class="text-muted">
							<span class="me-2 text-success"> 12% <i class="mdi mdi-arrow-up"></i> </span>
							{$_('From previous period')}
						</p>
						<div class="mt-4">
							<a
								href={'#'}
								class="inline-flex items-center justify-center rounded bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
							>
								{$_('View More')} <i class="mdi mdi-arrow-right ms-1"></i>
							</a>
						</div>
					</div>
					<div class="w-full px-2 sm:w-1/2">
						<div class="mt-4 sm:mt-0">
							<RadialBarChart chartColor={['--color-primary']} />
						</div>
					</div>
				</div>
				<p class="mb-0 text-muted">{$_('We craft digital, graphic and dimensional thinking.')}</p>
			</div>
		</div>
	</div>
	<div class="w-full xl:w-2/3 px-2">
		<!-- Mini stats row -->
		<div class="-mx-2 flex flex-wrap">
			{#each [
				{ label: 'Conversations', value: '1,235', icon: 'bx-copy-alt' },
				{ label: $_('Total Cost'), value: '$35, 723', icon: 'bx-archive-in' },
				{ label: $_('Average Cost'), value: '$16.2', icon: 'bx-purchase-tag-alt' }
			] as stat}
				<div class="w-full px-2 md:w-1/3">
					<div class="mb-4 rounded-md bg-white shadow ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
						<div class="p-4">
							<div class="flex">
								<div class="grow">
									<p class="text-muted font-medium">{stat.label}</p>
									<h4 class="mb-0 text-xl font-semibold">{stat.value}</h4>
								</div>
								<div class="shrink-0 self-center">
									<div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
										<i class="bx {stat.icon} text-2xl"></i>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Token Spent chart -->
		<div class="mb-4 rounded-md bg-white shadow ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
			<div class="p-4">
				<div class="flex flex-wrap items-center">
					<h4 class="mb-4 text-base font-medium text-dark dark:text-gray-100">{$_('Token Spent')}</h4>
					<ul class="ms-auto flex gap-1">
						{#each [
							{ label: $_('Week'), active: false },
							{ label: $_('Month'), active: false },
							{ label: $_('Year'), active: true }
						] as tab}
							<li>
								<a
									href={'#'}
									class="inline-flex items-center rounded px-3 py-1 text-sm transition-colors {tab.active
										? 'bg-primary text-white'
										: 'text-muted hover:bg-gray-100 dark:hover:bg-gray-700'}"
								>
									{tab.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>
				<StackedColumnChart chartColor={['--color-primary', '--color-warning', '--color-success']} />
			</div>
		</div>
	</div>
</div>

<div class="-mx-2 flex flex-wrap">
	{#each dashboard_model?.conversation_list || [] as conv (conv.conversation_id)}
		{#if conv?.conversation_id}
			<Conversation conversationId={conv.conversation_id} instruction={conv.instruction} userId={user.id}/>
		{/if}
	{/each}
</div>

<div class="-mx-2 flex flex-wrap">
	<SocialSource />
	<Activity />
	<TopSellingProduct />
</div>