<script>
    import { Circle, Jumper, DoubleBounce, Chasing } from 'svelte-loading-spinners';

    /**
     * @type {{
     *   disableDefaultStyles?: boolean,
     *   containerClasses?: string,
     *   containerStyles?: string,
     *   size?: number,
     *   color?: string,
     *   spinnerType?: 'circle' | 'jumper' | 'doubleBounce' | 'chasing' | 'random'
     * }}
     */
    let {
        disableDefaultStyles = false,
        containerClasses = '',
        containerStyles = '',
        size = 100,
        color = 'var(--color-primary)',
        spinnerType = 'chasing'
    } = $props();

    const SPINNER_MAP = {
        circle: Circle,
        jumper: Jumper,
        doubleBounce: DoubleBounce,
        chasing: Chasing
    };
    const SPINNER_TYPES = [Circle, Jumper, DoubleBounce, Chasing];
    const InnerSpinner = $derived(
        spinnerType === 'random'
            ? SPINNER_TYPES[Math.floor(Math.random() * SPINNER_TYPES.length)]
            : (SPINNER_MAP[spinnerType] ?? Chasing)
    );
</script>

<div
    class="{disableDefaultStyles ? '' : 'loader'} {containerClasses}"
    style={`${containerStyles}`}
>
    {#if disableDefaultStyles}
        <InnerSpinner {size} {color} unit="px" duration="1s" />
    {:else}
        <div class="loader-spinner" style={`--spinner-size: ${size}px;`}>
            <div class="loader-glow" aria-hidden="true"></div>
            <div class="loader-orbit loader-orbit-outer" aria-hidden="true"></div>
            <div class="loader-orbit loader-orbit-inner" aria-hidden="true"></div>
            <div class="loader-circle">
                <InnerSpinner {size} {color} unit="px" duration="1s" />
            </div>
        </div>
    {/if}
</div>

<style>
    /* Viewport-fixed frosted overlay that flex-centers the spinner so the
       loader always sits in the middle of the main content area, regardless
       of any positioned ancestor. The left edge tracks the vertical menu's
       width so the sidebar stays uncovered */
    .loader {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgb(255 255 255 / 0.55);
        backdrop-filter: blur(1px);
        -webkit-backdrop-filter: blur(1px);
        animation: loader-fade-in 0.25s ease-out;
        transition: left 0.2s;
    }

    :global(.dark) .loader {
        background-color: rgb(17 24 39 / 0.55);
    }

    @media (min-width: 1024px) {
        .loader {
            left: var(--sidebar-width);
        }

        :global(body.vertical-collpsed) .loader {
            left: var(--sidebar-collapsed-width);
        }
    }

    /* Spinner stack: glow halo + counter-rotating dashed orbits + the actual
       circle spinner, all centered on the same point with no surrounding card. */
    .loader-spinner {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: var(--spinner-size);
        height: var(--spinner-size);
        animation: loader-pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    /* The Circle spinner itself, with a soft primary-tinted drop shadow so
       the moving arc appears to glow rather than sit flat on the page. */
    .loader-circle {
        position: relative;
        z-index: 3;
        filter: drop-shadow(0 0 10px color-mix(in srgb, var(--color-primary) 55%, transparent));
    }

    /* Pulsing radial halo behind everything else. */
    .loader-glow {
        position: absolute;
        inset: -45%;
        border-radius: 50%;
        background: radial-gradient(
            circle at center,
            color-mix(in srgb, var(--color-primary) 55%, transparent) 0%,
            transparent 65%
        );
        filter: blur(22px);
        animation: loader-pulse 2.2s ease-in-out infinite;
        pointer-events: none;
        z-index: 0;
    }

    /* Two concentric dashed rings that rotate in opposite directions for a
       subtle "orbiting" effect around the spinner. */
    .loader-orbit {
        position: absolute;
        border-radius: 50%;
        border-style: dashed;
        border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
        pointer-events: none;
    }

    .loader-orbit-outer {
        inset: -28%;
        border-width: 2px;
        animation: loader-spin 6s linear infinite;
        z-index: 1;
    }

    .loader-orbit-inner {
        inset: -12%;
        border-width: 1px;
        border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
        animation: loader-spin 4s linear infinite reverse;
        z-index: 2;
    }

    @keyframes loader-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes loader-pop-in {
        from {
            opacity: 0;
            transform: scale(0.7);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    @keyframes loader-pulse {
        0%, 100% {
            opacity: 0.5;
            transform: scale(1);
        }
        50% {
            opacity: 1;
            transform: scale(1.18);
        }
    }

    @keyframes loader-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
</style>
