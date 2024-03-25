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
    <div class="alert-container">
        <Alert class="success">
            <div>{successText}</div>
        </Alert>
    </div>
{/if}

{#if isError}
    <div class="alert-container">
        <Alert class="error">
            <div>{errorText}</div>
        </Alert>
    </div>
{/if}
