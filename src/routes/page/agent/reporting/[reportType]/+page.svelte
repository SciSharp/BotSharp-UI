<script>
    import { _ } from 'svelte-i18n';
	import HeadTitle from "$lib/common/HeadTitle.svelte";
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import EmbeddingPage from '$lib/common/embedding/EmbeddingPage.svelte';

    /** @type {string?} */
    let label = '';
</script>

<HeadTitle title="{$_(label || 'Reporting')}" addOn="Reporting" />
<Breadcrumb title="{$_('Agent')}" pagetitle="{$_(label || 'Reporting')}" />

<EmbeddingPage
    htmlTagId="agent-reporting-content"
    slugName="reportType"
    bind:label={label}
/>