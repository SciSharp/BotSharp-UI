<script>
    import { Circle } from 'svelte-loading-spinners';

    export let disableDefaultStyles = false;
    export let containerClasses = '';
    export let size = 100;
</script>

<div class="{disableDefaultStyles ? '' : 'loader'} {containerClasses}">
    <Circle {size} color="var(--bs-primary)" unit="px" duration="1s" />
</div>
