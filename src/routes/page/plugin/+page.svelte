<script>
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import Plugins from './plugin-list.svelte';
    import { onMount } from 'svelte';
    import { getPlugins } from '$lib/services/plugin-service';
	import { PUBLIC_PLUGIN_DEFAULT_ICON } from '$env/static/public';
	import PlainPagination from '$lib/common/PlainPagination.svelte';

	const firstPage = 1;
	const pageSize = 12;

	/** @type {import('$types').PagedItems<import('$types').PluginDefModel>} */
    let plugins = { items: [], count: 0 };

	/** @type {import('$types').PluginFilter} */
	const initFilter = {
		pager: { page: firstPage, size: pageSize, count: 0 }
	};

    /** @type {import('$types').PluginFilter} */
    let filter = { ... initFilter };

	/** @type {import('$types').Pagination} */
	let pager = filter.pager;

    onMount(async () => {
		await getPagedPlugins();
    });

	async function getPagedPlugins() {
		plugins = await getPlugins(filter);
		refresh();
	}

	function refresh() {
		refreshPlugins();
		refreshPager(plugins.count, filter.pager.page, filter.pager.size);
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
	function refreshPager(totalItemsCount, page = firstPage, pageCount = pageSize) {
		pager = {
			page: page,
			size: pageCount || 0,
			count: totalItemsCount || 0
		};
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

	/** @param {import('$types').PluginDefModel} plugin */
	function getIconUrl(plugin) {
		if (plugin.is_core) {
			return '/images/logo.png';
		} else {
			return plugin.icon_url ? plugin.icon_url : PUBLIC_PLUGIN_DEFAULT_ICON;
		}
	}
</script>

<HeadTitle title="Plugins Grid" />
<Breadcrumb title="Plugin" pagetitle="List" />

<Plugins plugins={plugins.items} />
<PlainPagination pagination={pager} pageTo={pageTo} />