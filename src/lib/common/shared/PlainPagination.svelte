<script>
    /**
     * @type {{
     *   pagination?: import('$commonTypes').Pagination,
     *   pageTo: (pageNum: number) => void
     * }}
     */
    let {
        pagination = { page: 1, size: 10, count: 0 },
        pageTo
    } = $props();

	const firstPage = 1;
    const offSet = 2;

	/** @type {number} */
    let totalPages = $derived(Math.ceil(pagination.count / pagination.size));
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
        if (pagination.page === pageNum || pageNum < firstPage || pageNum > totalPages) {
			return;
		}
        pageTo(pageNum);
    }
</script>

<div class="row mb-3">
	<div class="col-lg-12">
		<div class="d-flex justify-content-center">
			<nav aria-label="Page navigation example" id="pagination-element" class="mb-0">
				<div class="pagination-block pagination pagination-rounded">
					<!-- svelte-ignore a11y_invalid_attribute -->
					<a href="javascript:void(0);" class={`page-link outline-none ${disableBackward ? 'disabled' : ''}`} id="page-first" aria-label="First page" onclick={(e) => { handlePageTo(e, firstPage); }}>
						<i class="bx bx-chevrons-left align-middle"></i>
					</a>
					<!-- svelte-ignore a11y_invalid_attribute -->
					<a href="javascript:void(0);" class={`page-link outline-none ${disableBackward ? 'disabled' : ''}`} id="page-prev" aria-label="Previous page" onclick={(e) => { handlePageTo(e, pagination.page - 1); }}>
						<i class="bx bx-chevron-left align-middle"></i>
					</a>

					{#each pages as page}
						<span id="page-num" class="outline-none pagination">
							<!-- svelte-ignore a11y_invalid_attribute -->
							<a href="javascript:void(0);" class={`page-link clickPageNumber ${pagination.page === page ? 'active' : ''}`} aria-current={pagination.page === page ? 'page' : undefined} onclick={(e) => handlePageTo(e, page)}>{page}</a>
						</span>
					{/each}

					<!-- svelte-ignore a11y_invalid_attribute -->
					<a href="javascript:void(0);" class={`page-link outline-none ${disableForward ? 'disabled' : ''}`} id="page-next" aria-label="Next page" onclick={(e) => { handlePageTo(e, pagination.page + 1); }}>
						<i class="bx bx-chevron-right align-middle"></i>
					</a>
					<!-- svelte-ignore a11y_invalid_attribute -->
					<a href="javascript:void(0);" class={`page-link outline-none ${disableForward ? 'disabled' : ''}`} id="page-last" aria-label="Last page" onclick={(e) => { handlePageTo(e, totalPages); }}>
						<i class="bx bx-chevrons-right align-middle"></i>
					</a>
				</div>
			</nav>
		</div>
	</div>
</div>