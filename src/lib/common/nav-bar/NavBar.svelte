<script>
    let {
        id = "nav-bar",
        role = "tablist",
        containerClasses = "",
        containerStyles = "",
        disableDefaultStyles = false,
        children
    } = $props();
</script>

<ul
    class="nav nav-tabs {disableDefaultStyles ? '' : 'nav-tabs-default nav-container'} {containerClasses}"
    style={`${containerStyles}`}
    {id}
    {role}
>
    {@render children?.()}
</ul>

<style>
    .nav-container {
        height: 100%;
    }
</style>