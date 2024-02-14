<script>
	import { Alert } from "@sveltestrap/sveltestrap";
	import Loader from "./Loader.svelte";

    export let isLoading = false;
    export let isComplete = false;
    export let isError = false;

    export let successText = 'Update completed!';
    export let errorText = 'Error!';
    export let spinnerSize = 50;
</script>

{#if isLoading}
  <Loader size={spinnerSize} />
{/if}

{#if isComplete}
  <Alert color="success">
    <div>{successText}</div>
  </Alert>
{/if}

{#if isError}
  <Alert color="danger">
    <div>{errorText}</div>
  </Alert>
{/if}