<script>
    import { Circle } from 'svelte-loading-spinners';
    export let size=100
</script>

<div class="loader">
    <Circle {size} color="var(--bs-primary)" unit="px" duration="1s" />
</div>
