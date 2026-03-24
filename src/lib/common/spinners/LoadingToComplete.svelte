<script>
	import Loader from "./Loader.svelte";

	/**
	 * @type {{
	 *   isLoading?: boolean,
	 *   isComplete?: boolean,
	 *   isError?: boolean,
	 *   spinnerClasses?: string,
	 *   spinnerStyles?: string,
	 *   spinnerSize?: number,
	 *   successText?: string,
	 *   errorText?: string
	 * }}
	 */
	let {
		isLoading = false,
		isComplete = false,
		isError = false,
		spinnerClasses = '',
		spinnerStyles = '',
		spinnerSize = 50,
		successText = 'Update completed!',
		errorText = 'Error!'
	} = $props();
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
        <div class="alert alert-success" role="alert">
            {successText}
        </div>
    </div>
{/if}

{#if isError}
    <div class="alert-container">
        <div class="alert alert-danger" role="alert">
            {errorText}
        </div>
    </div>
{/if}
