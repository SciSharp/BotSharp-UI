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
        color = 'var(--bs-primary)'
    } = $props();
</script>

<div
    class="{disableDefaultStyles ? '' : 'loader'} {containerClasses}"
    style={`${containerStyles}`}
>
    <Circle {size} {color} unit="px" duration="1s" />
</div>
