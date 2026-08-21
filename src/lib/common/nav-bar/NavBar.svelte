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
    class="tab-bar {disableDefaultStyles ? '' : 'tab-bar-default nav-tabs-default'} {containerClasses}"
    style={`${containerStyles}`}
    {id}
    {role}
>
    {@render children?.()}
</ul>

<style>
    /* Base tablist layout — replaces Bootstrap .nav.nav-tabs base. */
    .tab-bar {
        display: flex;
        flex-wrap: wrap;
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .tab-bar-default {
        height: 100%;
    }

    /* ---------- Tab variants ----------
       Implemented as :global() rules so they cascade across the NavBar→NavItem
       component boundary. Both variants share the same active/hover behavior,
       differing only in how the inactive label is rendered.

       These replace the legacy Bootstrap-driven rules in src/lib/scss/custom/components/_nav.scss
       that targeted .nav-tabs-default / .nav-tabs-secondary > .nav-item .nav-link. */

    :global(.tab-bar.nav-tabs-default),
    :global(.tab-bar.nav-tabs-secondary) {
        border-bottom: 2px solid rgb(229 231 235);
    }
    :global(.dark .tab-bar.nav-tabs-default),
    :global(.dark .tab-bar.nav-tabs-secondary) {
        border-bottom-color: rgb(55 65 81);
    }

    /* Inactive label color — default uses body color, secondary uses muted/capitalized */
    :global(.tab-bar.nav-tabs-default .tab-btn:not(.active):not(:disabled)) {
        color: var(--color-dark);
    }
    :global(.tab-bar.nav-tabs-secondary .tab-btn:not(.active):not(:disabled)) {
        color: var(--color-secondary);
        text-transform: capitalize;
    }

    /* Hover: subtle primary tint */
    :global(.tab-bar.nav-tabs-default .tab-btn:hover:not(:disabled):not(.active)),
    :global(.tab-bar.nav-tabs-secondary .tab-btn:hover:not(:disabled):not(.active)) {
        color: var(--color-primary);
    }

    /* Active: primary text + animated primary underline (1px below tablist border) */
    :global(.tab-bar.nav-tabs-default .tab-btn.active),
    :global(.tab-bar.nav-tabs-secondary .tab-btn.active) {
        color: var(--color-primary);
    }
    :global(.tab-bar.nav-tabs-default .tab-btn::after),
    :global(.tab-bar.nav-tabs-secondary .tab-btn::after) {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: -2px;
        height: 2px;
        background: var(--color-primary);
        transform: scaleX(0);
        transition: transform 250ms ease;
    }
    :global(.tab-bar.nav-tabs-default .tab-btn.active::after),
    :global(.tab-bar.nav-tabs-secondary .tab-btn.active::after) {
        transform: scaleX(1);
    }
</style>