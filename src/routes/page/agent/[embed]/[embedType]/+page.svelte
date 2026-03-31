<script>
    import { _ } from 'svelte-i18n';
    import { page } from '$app/stores';
    import lodash from 'lodash';
	import HeadTitle from "$lib/common/shared/HeadTitle.svelte";
	import EmbeddingPage from '$lib/common/embedding/EmbeddingPage.svelte';

    /** @type {string?} */
    let label = '';
</script>

<svelte:head>
    <style>
        .footer { display: none !important; }
    </style>
</svelte:head>

<HeadTitle title="{$_(label || 'Agent')}" addOn={`${lodash.capitalize($page.params.embed || '')}`} />

<EmbeddingPage
    htmlTagId="agent-embed-content"
    slugName="embedType"
    bind:label={label}
/>