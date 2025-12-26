<script>
    import { _ } from 'svelte-i18n';
    import { page } from '$app/stores';
    import lodash from 'lodash';
	import HeadTitle from "$lib/common/HeadTitle.svelte";
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import EmbeddingPage from '$lib/common/embedding/EmbeddingPage.svelte';

    /** @type {string?} */
    let label = '';
</script>

<HeadTitle title="{$_(label || 'Theme')}" addOn={`${lodash.capitalize($page.params.theme || '')}`} />
<Breadcrumb title="{$_('Agent')}" pagetitle="{$_(label || 'Theme')}" />

<EmbeddingPage
    htmlTagId="agent-theme-content"
    slugName="themeType"
    bind:label={label}
/>