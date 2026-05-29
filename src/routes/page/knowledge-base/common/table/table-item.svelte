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
                                --json-tree-font-family="var(--font-sans)"
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

