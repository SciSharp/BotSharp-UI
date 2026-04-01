<script>
    import { Circle } from 'svelte-loading-spinners';

    /**
     * @type {{
     *   disableDefaultStyles?: boolean,
     *   containerClasses?: string,
     *   containerStyles?: string,
     *   size?: number
     * }}
     */
    let {
        disableDefaultStyles = false,
        containerClasses = '',
        containerStyles = '',
        size = 100
    } = $props();
</script>

<div
    class="{disableDefaultStyles ? '' : 'loader'} {containerClasses}"
    style={`${containerStyles}`}
>
    <Circle {size} color="var(--bs-primary)" unit="px" duration="1s" />
</div>
