<script>
    import { _ } from 'svelte-i18n';
    import { page } from '$app/state';
    import { capitalize } from 'lodash';
	import HeadTitle from "$lib/common/shared/HeadTitle.svelte";
	import EmbeddingPage from '$lib/common/embedding/EmbeddingPage.svelte';

    /** @type {string} */
    let label = $state('');
</script>

<HeadTitle title={$_(label || 'Agent')} addOn={`${capitalize(page.params.embed || '')}`} />

<EmbeddingPage
    htmlTagId="agent-embed-content"
    slugName="embedType"
    bind:label={label}
/>