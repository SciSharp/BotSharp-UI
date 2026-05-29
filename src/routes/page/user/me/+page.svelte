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
<div class="-mx-2 flex flex-wrap">
	<div class="w-full px-2 xl:w-1/3">
		<!-- Profile card -->
		<div class="mb-4 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
			<div class="relative bg-linear-to-br from-primary to-primary-hover px-6 pb-20 pt-6 text-white">
				<div class="flex flex-wrap">
					<div class="w-7/12">
						<h5 class="text-lg font-semibold text-white">{$_('Welcome Back !')}</h5>
						<p class="mb-0 text-sm text-white/85">{PUBLIC_BRAND_NAME}</p>
					</div>
				</div>
				<!-- decorative blobs -->
				<div class="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10"></div>
				<div class="pointer-events-none absolute -bottom-2 right-10 h-16 w-16 rounded-full bg-white/5"></div>
			</div>
			<div class="-mt-16 flex flex-col items-center px-6 pb-6">
				<div class="relative h-28 w-28">
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
							class="h-full w-full cursor-pointer rounded-full border-4 border-white bg-white object-cover shadow-lg ring-1 ring-black/5 transition-transform hover:scale-[1.03] dark:border-gray-800 dark:bg-gray-700 dark:ring-white/10"
							onerror={e => handleAvatarLoad(e)}
						/>
					</FileDropZone>
					<div class="pointer-events-none absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-md ring-2 ring-white dark:ring-gray-800">
						<i class="mdi mdi-camera-outline text-sm"></i>
					</div>
				</div>
				<h5 class="mt-4 truncate text-center text-base font-semibold text-dark dark:text-gray-100">{currentUser?.full_name}</h5>
				<span class="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
					<i class="mdi mdi-shield-account-outline"></i>
					{currentUser?.role ?? 'Role: N/A'}
				</span>
			</div>
		</div>
		<!-- Personal Information card -->
		<div class="mb-4 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
			<div class="p-6">
				<h4 class="mb-4 flex items-center gap-2 text-base font-semibold text-dark dark:text-gray-100">
					<i class="mdi mdi-account-details-outline text-xl text-primary"></i>
					{$_('Personal Information')}
				</h4>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<tbody>
							<tr class="border-t border-gray-100 first:border-t-0 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40">
								<th class="py-3 pr-4 text-left align-top font-medium text-dark dark:text-gray-100">
									<span class="inline-flex items-center gap-2">
										<i class="mdi mdi-account-outline text-base text-primary/80"></i>
										{$_('First Name')}
									</span>
								</th>
								<td class="py-3 text-right text-muted">
									{currentUser?.first_name ?? 'N/A'}
								</td>
							</tr>
							<tr class="border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40">
								<th class="py-3 pr-4 text-left align-top font-medium text-dark dark:text-gray-100">
									<span class="inline-flex items-center gap-2">
										<i class="mdi mdi-account-circle-outline text-base text-primary/80"></i>
										{$_('Last Name')}
									</span>
								</th>
								<td class="py-3 text-right text-muted">
									{currentUser?.last_name ?? 'N/A'}
								</td>
							</tr>
							<tr class="border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40">
								<th class="py-3 pr-4 text-left align-top font-medium text-dark dark:text-gray-100">
									<span class="inline-flex items-center gap-2">
										<i class="mdi mdi-email-outline text-base text-primary/80"></i>
										{$_('Email')}
									</span>
								</th>
								<td class="py-3 text-right text-muted break-all">
									{currentUser?.email ?? 'N/A'}
								</td>
							</tr>
							<tr class="border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40">
								<th class="py-3 pr-4 text-left align-top font-medium text-dark dark:text-gray-100">
									<span class="inline-flex items-center gap-2">
										<i class="mdi mdi-source-fork text-base text-primary/80"></i>
										{$_('Account Origin')}
									</span>
								</th>
								<td class="py-3 text-right text-muted">
									{currentUser?.source} {currentUser?.external_id ?? 'N/A'}
								</td>
							</tr>
							<tr class="border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40">
								<th class="py-3 pr-4 text-left align-top font-medium text-dark dark:text-gray-100">
									<span class="inline-flex items-center gap-2">
										<i class="mdi mdi-calendar-edit-outline text-base text-primary/80"></i>
										{$_('Update Date')}
									</span>
								</th>
								<td class="py-3 text-right text-muted">
									{currentUser?.update_date
										? new Date(currentUser?.update_date).toLocaleString()
										: 'N/A'}
								</td>
							</tr>
							<tr class="border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40">
								<th class="py-3 pr-4 text-left align-top font-medium text-dark dark:text-gray-100">
									<span class="inline-flex items-center gap-2">
										<i class="mdi mdi-calendar-plus-outline text-base text-primary/80"></i>
										{$_('Create Date')}
									</span>
								</th>
								<td class="py-3 text-right text-muted">
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
