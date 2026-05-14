<script>
    import { fly } from 'svelte/transition';
	import Loader from "$lib/common/spinners/Loader.svelte";
	import { formatObject, splitTextByCase } from "$lib/helpers/utils/common";
    import JSONTree from 'svelte-json-tree';

    /**
     * @type {{
     *   item: any,
     *   columns: import('$commonTypes').TableItemConfig[],
     *   useJsonDisplay?: boolean,
     *   open?: boolean
     * }}
     */
    let {
        item,
        columns,
        useJsonDisplay = false,
        open = $bindable(false)
    } = $props();

    let isLoading = $state(false);
    let loadMore = $state(false);

    $effect(() => {
        if (!open) {
            loadMore = false;
        }
    });

    function toggleDetail() {
        open = !open;
    }
</script>

{#if isLoading}
    <Loader />
{/if}

<tr in:fly={{ y: -5, duration: 800 }}>
    {#if columns?.length > 0}
    {#each columns as column, idx (idx)}
        <td style={`max-width: 50px; width: ${80 / columns.length}%;`}>
            <div class="ti-ellipsis">{item[column.dataName] || ''}</div>
        </td>
    {/each}
    {/if}
    <td class="ti-op-cell">
        <div class="ti-op-actions">
            <button
                type="button"
                class="ti-op-btn"
                aria-label={open ? 'Hide detail' : 'View detail'}
                title={open ? 'Hide detail' : 'View detail'}
                aria-expanded={open}
                onclick={() => toggleDetail()}
            >
                {#if open}
                    <i class="bx bx-hide"></i>
                {:else}
                    <i class="mdi mdi-eye-outline"></i>
                {/if}
            </button>
        </div>
    </td>
</tr>

{#if open}
    <tr class="ti-detail-row" in:fly={{ y: -5, duration: 800 }} out:fly={{ y: -5, duration: 300 }}>
        <td colspan="12">
            <div class="ti-detail">
                <ul class="ti-detail-list">
                    {#each columns as column, idx (idx)}
                    <li class="ti-detail-row-item">
                        <div class="ti-detail-label">
                            {column.displayName || column.dataName}
                        </div>
                        <div class="ti-detail-value">
                            {item[column.dataName] || ''}
                        </div>
                    </li>
                    {/each}
                </ul>
                <div class="ti-more">
                    <button type="button" class="ti-more-btn" onclick={() => loadMore = !loadMore}>
                        <i class={`mdi ${loadMore ? 'mdi-chevron-up' : 'mdi-chevron-down'}`}></i>
                        <span>{loadMore ? 'Less' : 'More'}</span>
                    </button>
                </div>
                {#if loadMore}
                    <ul
                        class="ti-more-list"
                        in:fly={{ y: -5, duration: 300 }}
                        out:fly={{ y: -5, duration: 200 }}
                    >
                        {#if useJsonDisplay}
                            <JSONTree
                                value={formatObject(item)}
                                defaultExpandedLevel={1}
                                --json-tree-number-color="var(--color-info)"
                                --json-tree-boolean-color="var(--color-info)"
                                --json-tree-string-color="var(--color-info)"
                            />
                        {:else}
                            {#each Object.keys(item).filter(key => !columns.some(col => col.dataName === key)) as key, idx (idx)}
                                <li class="ti-more-item">
                                    <span class="ti-more-key">{splitTextByCase(key)}:</span>
                                    <span class="ti-more-val">{item[key]}</span>
                                </li>
                            {/each}
                        {/if}
                    </ul>
                {/if}
            </div>
        </td>
    </tr>
{/if}

<style>
    /* Ellipsis cell content (preserves the old .ellipsis behavior). */
    .ti-ellipsis {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* Action cell (was .knowledge-op + .knowledge-op-list). */
    .ti-op-cell {
        width: 20%;
    }
    .ti-op-actions {
        display: flex;
        justify-content: center;
        gap: 0.25rem;
    }

    /* Soft-primary icon button (was .btn-soft-primary). */
    .ti-op-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.875rem;
        height: 1.875rem;
        border: 1px solid transparent;
        border-radius: 0.4375rem;
        background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
        color: var(--color-primary);
        cursor: pointer;
        transition:
            background-color 0.15s ease,
            color 0.15s ease,
            transform 0.2s ease;
    }
    .ti-op-btn i {
        font-size: 0.95rem;
        line-height: 1;
    }
    .ti-op-btn:hover {
        background-color: var(--color-primary);
        color: rgb(255 255 255);
    }
    .ti-op-btn:active {
        transform: translateY(1px);
    }
    .ti-op-btn:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
    }

    /* Detail row "panel" container (was .knowledge-detail). */
    .ti-detail-row :global(td) {
        padding: 0.75rem 1rem !important;
        background-color: rgb(249 250 251);
    }
    .ti-detail {
        position: relative;
        border-radius: 0.5rem;
        padding: 0.875rem 1rem;
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        max-height: 320px;
        overflow-y: auto;
        scrollbar-width: thin;
    }

    .ti-detail-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
    }
    .ti-detail-row-item {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
    }
    .ti-detail-label {
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--color-primary);
        word-break: break-word;
    }
    .ti-detail-value {
        font-size: 0.875rem;
        color: rgb(31 41 55);
        word-break: break-word;
        white-space: normal;
    }

    /* Inline "More / Less" toggle (was .toggle-btn / .btn-link). */
    .ti-more {
        margin-top: 0.625rem;
    }
    .ti-more-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        border: 0;
        border-radius: 0.375rem;
        background: transparent;
        color: var(--color-primary);
        font-size: 0.75rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
    }
    .ti-more-btn i {
        font-size: 0.95rem;
        line-height: 1;
    }
    .ti-more-btn:hover {
        background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
    }
    .ti-more-btn:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
    }

    /* More-detail list (was .more-detail-list + .more-detail-item). */
    .ti-more-list {
        list-style: none;
        margin: 0.25rem 0 0;
        padding: 0.625rem 0.875rem;
        font-size: 0.75rem;
        color: var(--color-muted);
        background-color: rgb(249 250 251);
        border: 1px dashed rgb(229 231 235);
        border-radius: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    .ti-more-item {
        word-break: break-word;
        white-space: normal;
        display: flex;
        gap: 0.375rem;
        flex-wrap: wrap;
    }
    .ti-more-key {
        font-weight: 600;
        color: rgb(55 65 81);
    }
    .ti-more-val {
        color: var(--color-muted);
    }

    /* Dark mode. */
    :global(.dark) .ti-detail-row :global(td) {
        background-color: rgb(17 24 39);
    }
    :global(.dark) .ti-detail {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .ti-detail-value {
        color: rgb(229 231 235);
    }
    :global(.dark) .ti-more-list {
        background-color: rgb(17 24 39);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .ti-more-key {
        color: rgb(229 231 235);
    }
</style>