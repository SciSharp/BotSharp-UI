<script>
    import { page } from '$app/state';
    import Error500 from '$lib/common/errors/error-500.svelte'

    let status = $derived(page.status);
    let errorMessage = $derived(page.error?.message ?? '');
</script>

{#if status === 500}
    <Error500 />
{:else}
    <h1>{status} {errorMessage}</h1>
    <p>Sorry, something went wrong on our end. Please try again later.</p>
{/if}