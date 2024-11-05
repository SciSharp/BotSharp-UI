<script>
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import Plugins from './plugin-list.svelte';
    import { onDestroy, onMount } from 'svelte';
    import { getPlugins } from '$lib/services/plugin-service';
	import { PUBLIC_PLUGIN_DEFAULT_ICON } from '$env/static/public';
	import PlainPagination from '$lib/common/PlainPagination.svelte';
	import { _ } from 'svelte-i18n';
	import { globalEventStore } from '$lib/helpers/store';
	import { GlobalEvent } from '$lib/helpers/enums';

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
		await getPagedPlugins();

		unsubscriber = globalEventStore.subscribe((/** @type {import('$commonTypes').GlobalEvent} */ event) => {
			if (event.name !== GlobalEvent.Search) return;

			const names = event.payload ? [event.payload] : undefined;
			filter = {
				pager: { page: firstPage, size: pageSize, count: 0 },
				names: names
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