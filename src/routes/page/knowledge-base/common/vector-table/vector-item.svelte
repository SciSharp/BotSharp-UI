<script>
    import { createEventDispatcher } from "svelte";
    import { Button } from "@sveltestrap/sveltestrap";
    import { fly } from 'svelte/transition';
    import Swal from 'sweetalert2';
	import Loader from "$lib/common/Loader.svelte";
	import { KnowledgeCollectionType } from "$lib/helpers/enums";

    const svelteDispatch = createEventDispatcher();

    /** @type {import('$knowledgeTypes').KnowledgeSearchViewModel} */
    export let item;

    /** @type {string} */
    export let collection;

    /** @type {string} */
    export let collectionType;

    /** @type {boolean} */
    export let open = false;

    $: isQuestionAnswerCollection = collectionType === KnowledgeCollectionType.QuestionAnswer;
    $: isDocumentCollection = collectionType === KnowledgeCollectionType.Document;

    let isLoading = false;
    let loadMore = false;

    function toggleKnowledgeDetail() {
        open = !open;
        if (!open) {
            loadMore = false;
        }
    }

    /** @param {string} id */
    function deleteKnowledge(id) {
        if (!id) return;

        Swal.fire({
            title: 'Are you sure?',
            text: "Are you sure you want to delete this knowledge?",
            icon: 'warning',
            customClass: { confirmButton: 'danger-background' },
            showCancelButton: true,
            cancelButtonText: 'No',
            confirmButtonText: 'Yes'
        }).then(async (result) => {
            if (result.value) {
                svelteDispatch("delete", {
                    id: id,
                });
            }
        });
    }

    function editKnowledge() {
        svelteDispatch("update", {
            collection: collection,
            item: item
        });
    }
</script>

{#if isLoading}
    <Loader />
{/if}

<tr in:fly={{ y: -5, duration: 800 }}>
    <td class={`knowledge-text-qa ${isDocumentCollection ? 'knowledge-text' : ''}`}>
        <div class="ellipsis">{item?.data?.question || item?.data?.text || ''}</div>
    </td>
    {#if isQuestionAnswerCollection}
    <td class="knowledge-text-qa">
        <div class="ellipsis">{item?.data?.answer || ''}</div>
    </td>
    {/if}
    <td class="knowledge-op">
        <ul class="list-unstyled hstack gap-1 mb-0 knowledge-op-list">
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="View Detail">
                <Button
                    class="btn btn-sm btn-soft-primary"
                    on:click={() => toggleKnowledgeDetail()}
                >
                    {#if open}
                        <i class="bx bx-hide" />
                    {:else}
                        <i class="mdi mdi-eye-outline" />
                    {/if}
                </Button>
            </li>
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="Edit">
                <Button
                    class="btn btn-sm btn-soft-warning"
                    on:click={() => editKnowledge()}
                >
                    <i class="bx bxs-edit" />
                </Button>
            </li>
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="Delete">
                <Button
                    class="btn btn-sm btn-soft-danger"
                    on:click={() => deleteKnowledge(item?.id)}
                >
                    <i class="mdi mdi-delete-outline" />
                </Button>
            </li>
        </ul>
    </td>
</tr>

{#if open}
<tr in:fly={{ y: -5, duration: 800 }} out:fly={{ y: -5, duration: 300 }}>
    <td colspan="3">
        <div class="knowledge-detail">
            <ul>
            {#if isQuestionAnswerCollection}
                <li>
                    <div class="wrappable fw-bold text-primary">
                        {'Question:'}
                    </div>
                    <div class="wrappable">{item?.data?.question || item?.data?.text || ''}</div>
                </li>
                <li>
                    <div class="wrappable fw-bold text-primary">
                        {'Answer:'}
                    </div>
                    <div class="wrappable">{item?.data?.answer || ''}</div>
                </li>
            {:else if isDocumentCollection}
                <li>
                    <div class="wrappable fw-bold text-primary">
                        {'Text:'}
                    </div>
                    <div class="wrappable">{item?.data?.text || ''}</div>
                </li>
            {/if}

            {#if item?.score}
                <li>
                    <div class="wrappable fw-bold text-primary">
                        {'Score:'}
                    </div>
                    <div class="wrappable">{`${(item.score * 100).toFixed(4)}%`}</div>
                </li>
            {/if}
            </ul>
            {#if item?.id}
                <div class="more-detail">
                    <Button class='toggle-btn btn-sm' color="link" on:click={() => loadMore = !loadMore}>
                        {`${loadMore ? 'Less -' : 'More +'}`}
                    </Button>
                </div>
                {#if loadMore}
                    <ul
                        class="more-detail-list text-secondary"
                        in:fly={{ y: -5, duration: 300 }}
                        out:fly={{ y: -5, duration: 200 }}
                    >
                        <li class="more-detail-item wrappable">Data id: {item?.id || ''}</li>
                        {#if item?.data?.fileName}
                            <li class="more-detail-item wrappable">File name: {item?.data?.fileName}</li>
                        {/if}
                        {#if item?.vector}
                            <li class="more-detail-item wrappable">Vector dimension: {item?.vector?.length}</li>
                        {/if}
                    </ul>
                {/if}
            {/if}
        </div>
    </td>
</tr>
{/if}