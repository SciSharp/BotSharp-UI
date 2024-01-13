<script>
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
	import Plugins from './plugin-list.svelte';
    import { onMount } from 'svelte';
    import { getPlugins } from '$lib/services/plugin-service';

    /** @type {import('$types').PluginDefModel[]} */
    let plugins = [];

    onMount(async () => {
        plugins = await getPlugins();
    });
</script>

<HeadTitle title="Plugins Grid" />

<Breadcrumb title="Plugin" pagetitle="List" />

<Plugins plugins={plugins} />