<script>
    import Link from 'svelte-link';
	import {
		Col,
		Row,
	} from '@sveltestrap/sveltestrap';
	import { afterUpdate } from 'svelte';

    /** @type {import('$lib/helpers/types').Pagination} */    
    export let pagination = { page: 1, size: 10, count: 0 };
    /** @type {(pageNum: number) => void} */  
    export let pageTo;

	const firstPage = 1;
    const offSet = 2;

	/** @type {number} */
    $: totalPages = Math.ceil(pagination.count / pagination.size);
	/** @type {number} */
    $: minPage = Math.max(Math.min(pagination.page - offSet, totalPages - 2 * offSet), firstPage);
    /** @type {number} */
    $: maxPage = Math.min(Math.max(pagination.page + offSet, firstPage + 2 * offSet), totalPages);
    /** @type {number[]} */
    $: pages = Array.from({ length: maxPage - minPage + 1 }, (_, i) => minPage + i);
    /** @type {boolean} */
    $: disableBackward = pagination.page === firstPage;
    /** @type {boolean} */
    $: disableForward = pagination.page === totalPages;

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

<Row class="mb-3">
	<Col lg="12">
		<div class="d-flex justify-content-center">
			<nav aria-label="Page navigation example" id="pagination-element" class="mb-0">
				<div class="pagination-block pagination pagination-rounded">
					<Link class={`page-link outline-none ${disableBackward ? 'disabled' : ''}`} id="page-prev" on:click={(e) => { handlePageTo(e, pagination.page - 1); }}>
						<i class="bx bx-chevron-left align-middle" />
					</Link>

					{#each pages as page}
						<span id="page-num" class="outline-none pagination">
							<Link class={`page-link clickPageNumber`} active={pagination.page === page} on:click={(e) => handlePageTo(e, page)}>{page}</Link>
						</span>
					{/each}

					<Link class={`page-link outline-none ${disableForward ? 'disabled' : ''}`} id="page-next" on:click={(e) => { handlePageTo(e, pagination.page + 1); }}>
						<i class="bx bx-chevron-right align-middle" />
					</Link>
				</div>
			</nav>
		</div>
	</Col>
</Row>