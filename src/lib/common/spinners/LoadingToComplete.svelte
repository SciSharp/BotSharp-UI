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
	 *   spinnerType?: 'circle' | 'jumper' | 'doubleBounce' | 'chasing' | 'random',
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
		spinnerType = 'chasing',
		successText = 'Update completed!',
		errorText = 'Error!'
	} = $props();
</script>

{#if isLoading}
    <Loader
        size={spinnerSize}
        containerClasses={spinnerClasses}
        containerStyles={spinnerStyles}
        {spinnerType}
    />
{/if}


{#if isComplete}
    <div class="ltc-toast-container">
        <div class="ltc-toast ltc-toast-success" role="alert">
            <i class="mdi mdi-check-circle-outline ltc-toast-icon"></i>
            <span class="ltc-toast-text">{successText}</span>
        </div>
    </div>
{/if}

{#if isError}
    <div class="ltc-toast-container">
        <div class="ltc-toast ltc-toast-error" role="alert">
            <i class="mdi mdi-alert-circle-outline ltc-toast-icon"></i>
            <span class="ltc-toast-text">{errorText}</span>
        </div>
    </div>
{/if}

<style>
    /* Floating toast container, fixed-positioned near the top of the
       viewport. Replaces the legacy `.alert-container` rule in
       src/lib/scss/custom/components/_alert.scss. */
    .ltc-toast-container {
        position: fixed;
        top: 5%;
        left: 50%;
        transform: translateX(-50%);
        z-index: 8888;
        display: flex;
        justify-content: center;
        pointer-events: none;
        padding: 0 1rem;
        max-width: 90vw;
    }

    /* Toast pill — replaces Bootstrap `.alert .alert-success` / `.alert .alert-danger`.
       Soft semantic colors, layered shadow, icon + text layout. */
    .ltc-toast {
        display: inline-flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.625rem 1rem;
        border-radius: 0.625rem;
        border: 1px solid transparent;
        box-shadow:
            0 10px 25px -5px rgb(0 0 0 / 0.1),
            0 8px 10px -6px rgb(0 0 0 / 0.05);
        font-size: 0.875rem;
        line-height: 1.4;
        white-space: pre-line;
        pointer-events: auto;
    }

    .ltc-toast-success {
        background-color: color-mix(in srgb, var(--color-success) 95%, transparent);
        border-color: var(--color-success);
        color: rgb(255 255 255);
    }

    .ltc-toast-error {
        background-color: color-mix(in srgb, var(--color-danger) 95%, transparent);
        border-color: var(--color-danger);
        color: rgb(255 255 255);
    }

    .ltc-toast-icon {
        font-size: 1.25rem;
        line-height: 1;
        flex-shrink: 0;
    }

    .ltc-toast-text {
        font-weight: 500;
    }
</style>
