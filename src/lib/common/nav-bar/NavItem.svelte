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
    class="{disableDefaultContainerStyles ? '' : 'tab-item'} {containerClasses}"
    style={`${allowDelete ? 'display: flex;' : ''} ${containerStyles}`}
    id={containerId}
    role={containerRole}
>
    <button
        class="{disableDefaultNavBtnStyles ? '' : 'tab-btn'} {navBtnClasses}"
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
            <div class="tab-btn-label">{navBtnText}</div>
        {/if}
    </button>

    {#if allowDelete}
        {#if deleteIcon}
            {@render deleteIcon()}
        {:else}
            <button
                type="button"
                class="tab-delete-btn"
                aria-label="Delete tab"
                title="Delete"
                onclick={e => handleTabDelete(e)}
            >
                <i class="mdi mdi-minus-circle"></i>
            </button>
        {/if}
    {/if}
</li>

<style>
    /* Base tab item — replaces Bootstrap .nav-item layout. */
    .tab-item {
        flex: 0 1 50%;
        position: relative;
    }

    /* Base tab button — replaces Bootstrap .nav-link styling.
       Variant-specific colors (default vs secondary) and the active underline
       come from NavBar's :global() rules. This block sets the layout, baseline
       padding, font, and hover/disabled affordances. */
    .tab-btn {
        position: relative;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0.5rem 0.75rem;
        border: 0;
        background: transparent;
        font-family: inherit;
        font-weight: 500;
        font-size: 0.875rem;
        line-height: 1.5;
        color: var(--color-dark);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: color 0.15s ease, background-color 0.15s ease;
    }

    .tab-btn:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
    }

    .tab-btn:disabled {
        opacity: 0.65;
        cursor: not-allowed;
    }

    .tab-btn-label {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* Inline delete button shown alongside the tab when allowDelete=true. */
    .tab-delete-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-left: 0.25rem;
        padding: 0 0.25rem;
        border: 0;
        background: transparent;
        color: var(--color-danger);
        font-size: 1.125rem;
        line-height: 1;
        cursor: pointer;
        transition: transform 0.15s ease, color 0.15s ease;
    }
    .tab-delete-btn:hover {
        transform: scale(1.1);
    }
    .tab-delete-btn:focus-visible {
        outline: 2px solid var(--color-danger);
        outline-offset: 2px;
        border-radius: 0.25rem;
    }
</style>