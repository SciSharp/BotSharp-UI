<script>

    /** @type {string} */
    export let containerClasses = "";

    /** @type {string} */
    export let containerStyles = "";

    /** @type {boolean} */
    export let disableDefaultContainerStyles = false;

    /** @type {string} */
    export let containerRole = "presentation";

    /** @type {string} */
    export let containerId = "nav-item";

    /** @type {string} */
    export let navBtnClasses = "";

    /** @type {string} */
    export let navBtnStyles = "";

    /** @type {boolean} */
    export let disableDefaultNavBtnStyles = false;

    /** @type {string} */
    export let navBtnRole = "tab";

    /** @type {string} */
    export let navBtnId = "nav-item-id";

    /** @type {string} */
    export let navBtnText;

    /** @type {boolean} */
    export let active = false;

    /** @type {boolean} */
    export let disabled = false;

    /** @type {string} */
    export let dataBsToggle = "tab";

    /** @type {string} */
    export let dataBsTarget = "#nav-item-pane";

    /** @type {string} */
    export let ariaControls = "nav-item-tab-pane";

    /** @type {() => void} */
    export let onClick = () => {};

    /** @param {any} e */
    function handleTabClick(e) {
        e.preventDefault();
        onClick?.();
    }
</script>

<li
    class="{disableDefaultContainerStyles ? '' : 'nav-item tab-item'} {containerClasses}"
    style={`${containerStyles}`}
    id={containerId}
    role={containerRole}
>
    <button
        class="{disableDefaultNavBtnStyles ? '' : 'nav-link tab-btn'} {navBtnClasses}"
        class:active={active}
        style={`${navBtnStyles}`}
        id={navBtnId}
        type="button" 
        role={navBtnRole}
        data-bs-toggle={dataBsToggle}
        data-bs-target={dataBsTarget}
        aria-controls={ariaControls}
        aria-selected={`${active ? "true" : "false"}`}
        disabled={disabled}
        on:click={(e) => handleTabClick(e)}
    >
        {navBtnText}
    </button>
</li>

<style>
    .tab-item {
        flex: 0 1 50%;
    }

    .tab-btn {
        width: 100%;
        height: 100%;
        border: none !important;
        color: white !important;
        font-weight: 500;
        font-size: 1.2em;
    }

    .tab-btn.active {
        background-color: var(--bs-primary) !important;
    }
</style>