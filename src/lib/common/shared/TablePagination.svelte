<script>
    import { _ } from 'svelte-i18n'

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

<div class="row justify-content-between align-items-center">
    <div class="col-auto me-auto">
        <p class="text-muted mb-0">{$_('Showing')} <b>{start}</b> {$_('to')} <b>{end}</b> {$_('of')} <b>{pagination.count}</b> {$_('entries')}</p>
    </div>
    <div class="col-auto">
        <div class="card d-inline-block ms-auto mb-0">
            <div class="card-body p-2">
                <nav aria-label="Page navigation example" class="mb-0">
                    <ul class="pagination mb-0">
                        <li class="page-item">
                            <!-- svelte-ignore a11y_invalid_attribute -->
                            <a href="javascript:void(0);" class={`page-link ${disableBackward ? 'disabled' : ''}`} aria-label="Begin" onclick={(e) => handlePageTo(e, firstPage)}>
                                <span aria-hidden="true">&laquo;&laquo;</span>
                            </a>
                        </li>
                        <li class="page-item">
                            <!-- svelte-ignore a11y_invalid_attribute -->
                            <a href="javascript:void(0);" class={`page-link ${disableBackward ? 'disabled' : ''}`} aria-label="Previous" onclick={(e) => handlePageTo(e, pagination.page - 1)}>
                                <span aria-hidden="true">&laquo;</span>
                            </a>
                        </li>

                        {#each pages as page}
                            <li class={`page-item ${page === pagination.page ? 'active' : ''}`}>
                                <!-- svelte-ignore a11y_invalid_attribute -->
                                <a href="javascript:void(0);" class="page-link" aria-current={pagination.page === page ? 'page' : undefined} onclick={(e) => handlePageTo(e, page)}>{page}</a>
                            </li>
                        {/each}

                        <li class="page-item">
                            <!-- svelte-ignore a11y_invalid_attribute -->
                            <a href="javascript:void(0);" class={`page-link ${disableForward ? 'disabled' : ''}`} aria-label="Next" onclick={(e) => handlePageTo(e, pagination.page + 1)}>
                                <span aria-hidden="true">&raquo;</span>
                            </a>
                        </li>
                        <li class="page-item">
                            <!-- svelte-ignore a11y_invalid_attribute -->
                            <a href="javascript:void(0);" class={`page-link ${disableForward ? 'disabled' : ''}`} aria-label="Last" onclick={(e) => handlePageTo(e, totalPages)}>
                                <span aria-hidden="true">&raquo;&raquo;</span>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    </div>
    <!--end col-->
</div>

