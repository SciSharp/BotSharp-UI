<script>
    import { onMount } from 'svelte';
	import Link from 'svelte-link';  
    import { _ } from 'svelte-i18n'  

    /** @type {import('$types').Pagination} */    
    export let pagination;
    /** @type {(pageNum: number) => void} */  
    export let pageTo;

    const firstPage = 1;
    const offSet = 2;

    /** @type {number} */
    $: totalPages = Math.ceil(pagination.count / pagination.size);
    /** @type {number} */
    $: start = pagination.count <= 0 ? 0 : (pagination.page - 1) * pagination.size + 1;
    /** @type {number} */
    $: end = Math.min(pagination.page * pagination.size, pagination.count);
    /** @type {number} */
    $: minPage = Math.max(Math.min(pagination.page - offSet, totalPages - 2 * offSet), firstPage);
    /** @type {number} */
    $: maxPage = Math.min(Math.max(pagination.page + offSet, firstPage + 2 * offSet), totalPages);
    /** @type {number[]} */
    $: pages = Array.from({ length: maxPage - minPage + 1 }, (_, i) => minPage + i);
    /** @type {boolean} */
    $: disableBackward = pagination.page === firstPage || pagination.count === 0;
    /** @type {boolean} */
    $: disableForward = pagination.page === totalPages || pagination.count === 0;

    /**
	 * @param {any} e
	 * @param {number} pageNum
	 */
    function handlePageTo(e, pageNum) {
        e.preventDefault();
        if (pagination.page === pageNum || pageNum < firstPage || pageNum > totalPages) return;
        pageTo(pageNum);
    }

    onMount(async () => {

    });    
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
                            <Link class={`page-link ${disableBackward ? 'disabled' : ''}`} aria-label="Begin" on:click={(e) => handlePageTo(e, firstPage)}>
                                <span aria-hidden="true">&laquo;&laquo;</span>
                            </Link>
                        </li>
                        <li class="page-item">
                            <Link class={`page-link ${disableBackward ? 'disabled' : ''}`} aria-label="Previous" on:click={(e) => handlePageTo(e, pagination.page - 1)}>
                                <span aria-hidden="true">&laquo;</span>
                            </Link>
                        </li>
                
                        {#each pages as page}
                            <li class={`page-item ${page === pagination.page ? 'active' : ''}`}>
                                <Link class="page-link" on:click={(e) => handlePageTo(e, page)}>{page}</Link>
                            </li>
                        {/each}
                
                        <li class="page-item">
                            <Link class={`page-link ${disableForward ? 'disabled' : ''}`} aria-label="Next" on:click={(e) => handlePageTo(e, pagination.page + 1)}>
                                <span aria-hidden="true">&raquo;</span>
                            </Link>
                        </li>
                        <li class="page-item">
                            <Link class={`page-link ${disableForward ? 'disabled' : ''}`} aria-label="Last" on:click={(e) => handlePageTo(e, totalPages)}>
                                <span aria-hidden="true">&raquo;&raquo;</span>
                            </Link>
                        </li>
                    </ul>
                </nav>                
            </div>
        </div>
    </div>
    <!--end col-->
</div>

