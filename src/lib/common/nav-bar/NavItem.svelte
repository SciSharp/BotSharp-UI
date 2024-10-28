<script>
	import InPlaceEdit from "../InPlaceEdit.svelte";


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

    /** @type {boolean} */
    export let allowEdit = false;

    /** @type {number} */
    export let maxEditLength = 30;

    /** @type {string} */
    export let editPlaceholder = "Please edit here...";

    /** @type {boolean} */
    export let allowDelete = false;

    /** @type {string} */
    export let dataBsToggle = "tab";

    /** @type {string} */
    export let dataBsTarget = "#nav-item-pane";

    /** @type {string} */
    export let ariaControls = "nav-item-tab-pane";

    /** @type {() => void} */
    export let onClick = () => {};

    /** @type {() => void} */
    export let onDelete = () => {};

    /** @param {any} e */
    function handleTabClick(e) {
        e.preventDefault();
        onClick?.();
    }

    /** @param {any} e */
    function handleTabDelete(e) {
        e.preventDefault();
        onDelete?.();
    }
</script>

<li
    class="{disableDefaultContainerStyles ? '' : 'nav-item tab-item'} {containerClasses}"
    style={`${allowDelete ? 'display: flex;' : ''} ${containerStyles}`}
    id={containerId}
    role={containerRole}
>
    <button
        class="{disableDefaultNavBtnStyles ? '' : 'tab-btn nav-link'} {navBtnClasses}"
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
        {#if allowEdit}
            <InPlaceEdit bind:value={navBtnText} maxLength={maxEditLength} placeholder={editPlaceholder} />
        {:else}
            <div style="height: 100%" class="line-align-center">
                <div>{navBtnText}</div>
            </div>
        {/if}
    </button>
    
    {#if allowDelete}
        <slot name="delete-icon">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="line-align-center">
                <i
                    class="mdi mdi-minus-circle text-danger clickable"
                    on:click={e => handleTabDelete(e)}
                />
            </div>
        </slot>
    {/if}
</li>

<style>
    .tab-item {
        flex: 0 1 50%;
    }

    .tab-btn {
        width: 100%;
        height: 100%;
        border: none !important;
        color: white;
        font-weight: 500;
        display: inline-flex;
        justify-content: center;
    }

    .tab-btn.active {
        color: var(--bs-primary);
    }
</style>