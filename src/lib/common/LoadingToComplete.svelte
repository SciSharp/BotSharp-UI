<script>
	import { Alert } from "@sveltestrap/sveltestrap";
	import Loader from "./Loader.svelte";

    export let isLoading = false;
    export let isComplete = false;
    export let isError = false;
</script>

{#if isLoading}
  <Loader />
{/if}

{#if isComplete}
  <Alert color="success">
    <div>Update completed!</div>
  </Alert>
{/if}

{#if isError}
  <Alert color="danger">
    <div>Error!</div>
  </Alert>
{/if}