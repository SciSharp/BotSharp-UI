<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
	import Plugins from './plugin-list.svelte';
	import { getPlugins } from '$lib/services/plugin-service';
	import { PUBLIC_PLUGIN_DEFAULT_ICON } from '$env/static/public';
	import PlainPagination from '$lib/common/shared/PlainPagination.svelte';
	import { _ } from 'svelte-i18n';
	import { globalEventStore } from '$lib/helpers/store';
	import { GlobalEvent } from '$lib/helpers/enums';
	import {
		getPagingQueryParams,
		setUrlQueryParams,
		goToUrl,
		formatNumber
	} from '$lib/helpers/utils/common';

	const firstPage = 1;
	const pageSize = 12;
	let isPageMounted = false;

	/** @type {import('$commonTypes').PagedItems<import('$pluginTypes').PluginDefModel>} */
	let plugins = $state({ items: [], count: 0 });

	/** @type {import('$pluginTypes').PluginFilter} */
	const initFilter = {
		pager: { page: firstPage, size: pageSize, count: 0 }
	};

	/** @type {import('$pluginTypes').PluginFilter} */
	let filter = $state({ ...initFilter });

	/** @type {import('$commonTypes').Pagination} */
	// svelte-ignore state_referenced_locally
	let pager = $state(filter.pager);

	/** @type {any} */
	let unsubscriber;

	onMount(async () => {
		isPageMounted = true;
		const { pageNum, pageSizeNum } = getPagingQueryParams({
			page: $page.url.searchParams.get("page"),
			pageSize: $page.url.searchParams.get("pageSize")
		}, { defaultPageSize: pageSize });

		filter = {
			...filter,
			pager: {
				...filter.pager,
				page: pageNum,
				size: pageSizeNum
			}
		};

		await getPagedPlugins();

		unsubscriber = globalEventStore.subscribe((/** @type {import('$commonTypes').GlobalEvent} */ event) => {
			if (event.name !== GlobalEvent.Search) return;

			filter = {
				pager: {
					...filter.pager,
					page: firstPage,
					count: 0
				},
				similarName: event.payload || null
			};

			getPagedPlugins();
		});
	});

	onDestroy(() => {
		isPageMounted = false;
		unsubscriber?.();
	});

	async function getPagedPlugins() {
		plugins = await getPlugins(filter);
		refresh();
	}

	function refresh() {
		refreshPlugins();
		refreshPager(plugins.count, filter.pager.page);
	}

	function refreshPlugins() {
		plugins = {
			items: plugins?.items?.map(t => {
				return {
					...t,
					icon_url: getIconUrl(t)
				};
			}) || [],
			count: plugins?.count || 0
		};
	}

	/** @param {number} totalItemsCount */
	function refreshPager(totalItemsCount, pageNum = firstPage) {
		pager = {
			...filter.pager,
			page: pageNum,
			count: totalItemsCount || 0
		};

		setUrlQueryParams($page.url, [
			{ key: 'page', value: `${pager.page}` },
			{ key: 'pageSize', value: `${pager.size}` }
		], (url) => {
			if (!isPageMounted) return;
			goToUrl(`${url.pathname}${url.search}`);
		});
	}

	/**
	 * @param {number} pageNum
	 */
	function pageTo(pageNum) {
		pager = {
			...pager,
			page: pageNum
		};

		filter = {
			...filter,
			pager: pager
		};

		getPagedPlugins();
	}

	/** @param {import('$pluginTypes').PluginDefModel} plugin */
	function getIconUrl(plugin) {
		if (plugin.is_core) {
			return 'images/logo.png';
		} else {
			return plugin.icon_url ? plugin.icon_url : PUBLIC_PLUGIN_DEFAULT_ICON;
		}
	}
</script>

<HeadTitle title={$_('Plugin')} />
<Breadcrumb title={$_('Plugin')} pagetitle={$_('List')} />

<div class="flex flex-wrap">
	<div class="w-full">
		<div class="rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
			<div class="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
				<div class="flex items-center gap-3">
					<span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
						<i class="mdi mdi-puzzle-outline text-xl"></i>
					</span>
					<div class="grow">
						<h5 class="mb-0 text-base font-semibold text-dark dark:text-gray-100">{$_('Plugin')} {$_('List')}</h5>
						<p class="mb-0 text-xs text-muted">{formatNumber(pager.count)} {pager.count === 1 ? 'plugin' : 'plugins'} total</p>
					</div>
				</div>
			</div>
			<div class="p-4 sm:p-6">
				<Plugins plugins={plugins.items} />
				<PlainPagination pagination={pager} pageTo={pageTo} />
			</div>
		</div>
	</div>
</div>