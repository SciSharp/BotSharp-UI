<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import Plugins from './plugin-list.svelte';
    import { getPlugins } from '$lib/services/plugin-service';
	import { PUBLIC_PLUGIN_DEFAULT_ICON } from '$env/static/public';
	import PlainPagination from '$lib/common/PlainPagination.svelte';
	import { _ } from 'svelte-i18n';
	import { globalEventStore } from '$lib/helpers/store';
	import { GlobalEvent } from '$lib/helpers/enums';
	import {
		getPagingQueryParams,
		setUrlQueryParams,
		goToUrl
	} from '$lib/helpers/utils/common';

	const firstPage = 1;
	const pageSize = 12;

	/** @type {import('$commonTypes').PagedItems<import('$pluginTypes').PluginDefModel>} */
    let plugins = { items: [], count: 0 };

	/** @type {import('$pluginTypes').PluginFilter} */
	const initFilter = {
		pager: { page: firstPage, size: pageSize, count: 0 }
	};

    /** @type {import('$pluginTypes').PluginFilter} */
    let filter = { ... initFilter };

	/** @type {import('$commonTypes').Pagination} */
	let pager = filter.pager;

	/** @type {any} */
	let unsubscriber;

    onMount(async () => {
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
		], () => goToUrl(`${$page.url.pathname}${$page.url.search}`));
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

<HeadTitle title="{$_('Plugin')}" />
<Breadcrumb title="{$_('Plugin')}" pagetitle="{$_('List')}" />

<Plugins plugins={plugins.items} />
<PlainPagination pagination={pager} pageTo={pageTo} />