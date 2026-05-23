<script>
    import { _ } from 'svelte-i18n'
    import { formatNumber } from '$lib/helpers/utils/common';

    /**
     * @type {{
     *   pagination: import('$commonTypes').Pagination,
     *   pageTo: (pageNum: number) => void
     * }}
     */
    let {
        pagination,
        pageTo
    } = $props();

    const firstPage = 1;
    const offSet = 2;

    /** @type {number} */
    let totalPages = $derived(Math.ceil(pagination.count / pagination.size));
    /** @type {number} */
    let start = $derived(pagination.count <= 0 ? 0 : (pagination.page - 1) * pagination.size + 1);
    /** @type {number} */
    let end = $derived(Math.min(pagination.page * pagination.size, pagination.count));
    /** @type {number} */
    let minPage = $derived(Math.max(Math.min(pagination.page - offSet, totalPages - 2 * offSet), firstPage));
    /** @type {number} */
    let maxPage = $derived(Math.min(Math.max(pagination.page + offSet, firstPage + 2 * offSet), totalPages));
    /** @type {number[]} */
    let pages = $derived(Array.from({ length: maxPage - minPage + 1 }, (_, i) => minPage + i));
    /** @type {boolean} */
    let disableBackward = $derived(pagination.page === firstPage || pagination.count === 0);
    /** @type {boolean} */
    let disableForward = $derived(pagination.page === totalPages || pagination.count === 0);

    /**
	 * @param {any} e
	 * @param {number} pageNum
	 */
    function handlePageTo(e, pageNum) {
        e.preventDefault();
        if (pagination.page === pageNum || pageNum < firstPage || pageNum > totalPages) return;
        pageTo(pageNum);
    }
</script>

<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
    <p class="mb-0 text-sm text-muted">
        {$_('Showing')}
        <span class="font-semibold text-dark dark:text-gray-100">{formatNumber(start)}</span>
        {$_('to')}
        <span class="font-semibold text-dark dark:text-gray-100">{formatNumber(end)}</span>
        {$_('of')}
        <span class="font-semibold text-dark dark:text-gray-100">{formatNumber(pagination.count)}</span>
        {$_('entries')}
    </p>

    <nav aria-label="Page navigation" class="inline-flex items-center gap-1 rounded-lg bg-gray-50 p-1 ring-1 ring-gray-100 dark:bg-gray-700/50 dark:ring-gray-700">
        <!-- svelte-ignore a11y_invalid_attribute -->
        <a
            href="javascript:void(0);"
            class="page-btn {disableBackward ? 'is-disabled' : ''}"
            aria-label="First page"
            aria-disabled={disableBackward}
            onclick={(e) => handlePageTo(e, firstPage)}
        >
            <i class="bx bx-chevrons-left text-base leading-none"></i>
        </a>
        <!-- svelte-ignore a11y_invalid_attribute -->
        <a
            href="javascript:void(0);"
            class="page-btn {disableBackward ? 'is-disabled' : ''}"
            aria-label="Previous page"
            aria-disabled={disableBackward}
            onclick={(e) => handlePageTo(e, pagination.page - 1)}
        >
            <i class="bx bx-chevron-left text-base leading-none"></i>
        </a>

        {#each pages as page}
            <!-- svelte-ignore a11y_invalid_attribute -->
            <a
                href="javascript:void(0);"
                class="page-btn page-num {page === pagination.page ? 'is-active' : ''}"
                aria-current={pagination.page === page ? 'page' : undefined}
                onclick={(e) => handlePageTo(e, page)}
            >
                {page}
            </a>
        {/each}

        <!-- svelte-ignore a11y_invalid_attribute -->
        <a
            href="javascript:void(0);"
            class="page-btn {disableForward ? 'is-disabled' : ''}"
            aria-label="Next page"
            aria-disabled={disableForward}
            onclick={(e) => handlePageTo(e, pagination.page + 1)}
        >
            <i class="bx bx-chevron-right text-base leading-none"></i>
        </a>
        <!-- svelte-ignore a11y_invalid_attribute -->
        <a
            href="javascript:void(0);"
            class="page-btn {disableForward ? 'is-disabled' : ''}"
            aria-label="Last page"
            aria-disabled={disableForward}
            onclick={(e) => handlePageTo(e, totalPages)}
        >
            <i class="bx bx-chevrons-right text-base leading-none"></i>
        </a>
    </nav>
</div>

<style>
    .page-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        height: 2rem;
        padding: 0 0.5rem;
        border-radius: 0.375rem;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--color-muted);
        text-decoration: none;
        transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
    }

    .page-btn:hover:not(.is-disabled):not(.is-active) {
        background-color: rgb(255 255 255);
        color: var(--color-primary);
        box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
    }

    :global(.dark) .page-btn:hover:not(.is-disabled):not(.is-active) {
        background-color: rgb(31 41 55);
        color: rgb(255 255 255);
    }

    .page-btn.is-active {
        background-color: var(--color-primary);
        color: rgb(255 255 255);
        box-shadow: 0 1px 3px rgb(0 0 0 / 0.12);
    }

    .page-btn.is-disabled {
        opacity: 0.4;
        cursor: not-allowed;
        pointer-events: none;
    }
</style>

