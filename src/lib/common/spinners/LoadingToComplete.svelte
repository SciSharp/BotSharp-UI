<script>
	import { Alert } from "@sveltestrap/sveltestrap";
	import Loader from "./Loader.svelte";

    export let isLoading = false;
    export let isComplete = false;
    export let isError = false;
    export let spinnerClasses = '';
    export let spinnerStyles = '';
    export let spinnerSize = 50;

    export let successText = 'Update completed!';
    export let errorText = 'Error!';
</script>

{#if isLoading}
    <Loader
        size={spinnerSize}
        containerClasses={spinnerClasses}
        containerStyles={spinnerStyles}
    />
{/if}


{#if isComplete}
    <div class="alert-container">
        <Alert color="success">
            <div>{successText}</div>
        </Alert>
    </div>
{/if}

{#if isError}
    <div class="alert-container">
        <Alert color="danger">
            <div>{errorText}</div>
        </Alert>
    </div>
{/if}
