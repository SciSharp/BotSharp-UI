<script>
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import Plugins from './plugin-list.svelte';
    import { onMount } from 'svelte';
    import { getPlugins } from '$lib/services/plugin-service';
	import { PUBLIC_PLUGIN_DEFAULT_ICON } from '$env/static/public';

    /** @type {import('$types').PluginDefModel[]} */
    let plugins = [];

    onMount(async () => {
        plugins = await getPlugins();
		plugins.forEach(element => {
			element.icon_url = getIconUrl(element);
		});
    });

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

<Plugins plugins={plugins} />