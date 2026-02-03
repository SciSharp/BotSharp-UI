<script>
    import { _ } from 'svelte-i18n';
    import { page } from '$app/stores';
    import lodash from 'lodash';
	import HeadTitle from "$lib/common/shared/HeadTitle.svelte";
	import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import EmbeddingPage from '$lib/common/embedding/EmbeddingPage.svelte';

    /** @type {string?} */
    let label = '';
</script>

<HeadTitle title="{$_(label || 'Knowledge Base')}" addOn={`${lodash.capitalize($page.params.embed || '')}`} />
<Breadcrumb title="{$_('Knwoledge Base')}" pagetitle="{$_(label || 'Knwoledge Base')}" />

<EmbeddingPage
    htmlTagId="knwoledgebase-embed-content"
    slugName="embedType"
    bind:label={label}
/>