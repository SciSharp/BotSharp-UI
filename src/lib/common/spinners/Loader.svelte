<script>
    import { Circle } from 'svelte-loading-spinners';

    /**
     * @type {{
     *   disableDefaultStyles?: boolean,
     *   containerClasses?: string,
     *   containerStyles?: string,
     *   size?: number,
     *   color?: string
     * }}
     */
    let {
        disableDefaultStyles = false,
        containerClasses = '',
        containerStyles = '',
        size = 100,
        color = 'var(--color-primary)'
    } = $props();
</script>

<div
    class="{disableDefaultStyles ? '' : 'loader'} {containerClasses}"
    style={`${containerStyles}`}
>
    <Circle {size} {color} unit="px" duration="1s" />
</div>

<style>
    /* Full-area translucent overlay that flex-centers the spinner.
       Replaces the legacy `.loader` rule from src/lib/scss/custom/components/_loader.scss
       which used a fragile `position: relative; top: 30%; left: 50%` shift on
       the inner `.circle` element to center the spinner. */
    .loader {
        position: absolute;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgb(255 255 255 / 0.8);
    }

    :global(.dark) .loader {
        background-color: rgb(17 24 39 / 0.7);
    }
</style>
