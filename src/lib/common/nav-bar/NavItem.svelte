<script>
	import InPlaceEdit from "../shared/InPlaceEdit.svelte";

    let {
        containerClasses = "",
        containerStyles = "",
        disableDefaultContainerStyles = false,
        containerRole = "presentation",
        containerId = "nav-item",
        navBtnClasses = "",
        navBtnStyles = "",
        disableDefaultNavBtnStyles = false,
        navBtnRole = "tab",
        navBtnId = "nav-item-id",
        navBtnText = $bindable(),
        active = false,
        disabled = false,
        allowEdit = false,
        maxEditLength = 30,
        editPlaceholder = "Please edit here...",
        allowDelete = false,
        dataBsToggle = "tab",
        dataBsTarget = "#nav-item-pane",
        ariaControls = "nav-item-tab-pane",
        onClick = () => {},
        onDelete = () => {},
        onInput = () => {},
        /** @type {import('svelte').Snippet | undefined} */
        deleteIcon = undefined
    } = $props();

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

    /** @param {any} e */
    function handleTabInput(e) {
        e.preventDefault();
        onInput?.();
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
        {disabled}
        onclick={(e) => handleTabClick(e)}
    >
        {#if allowEdit}
            <InPlaceEdit
                bind:value={navBtnText}
                maxLength={maxEditLength}
                placeholder={editPlaceholder}
                onInput={handleTabInput}
            />
        {:else}
            <div style="height: 100%;" class="line-align-center ellipsis">
                <div>{navBtnText}</div>
            </div>
        {/if}
    </button>

    {#if allowDelete}
        {#if deleteIcon}
            {@render deleteIcon()}
        {:else}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="line-align-center">
                <i
                    class="mdi mdi-minus-circle text-danger clickable"
                    onclick={e => handleTabDelete(e)}
                ></i>
            </div>
        {/if}
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