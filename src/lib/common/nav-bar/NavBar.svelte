<script>

    /** @type {string} */
    export let id = "nav-bar";

    /** @type {string} */
    export let role = "tablist";

    /** @type {string} */
    export let containerClasses = "";

    /** @type {string} */
    export let containerStyles = "";

    /** @type {boolean} */
    export let disableDefaultStyles = false;
</script>

<ul
    class="{disableDefaultStyles ? '' : 'nav nav-tabs nav-tabs-custom nav-justified nav-container'} {containerClasses}"
    style={`${containerStyles}`}
    id={id}
    role={role}
>
    <slot />
</ul>

<style>
    .nav-container {
        height: 100%;
    }
</style>