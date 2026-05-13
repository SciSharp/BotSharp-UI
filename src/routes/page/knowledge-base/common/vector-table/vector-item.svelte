<script>
    import { fly } from 'svelte/transition';
    import Swal from 'sweetalert2';
	import Loader from "$lib/common/spinners/Loader.svelte";
	import { KnowledgeBaseType, KnowledgePayloadName } from "$lib/helpers/enums";

    let {
        /** @type {import('$knowledgeTypes').KnowledgeQueryViewModel} */
        item,
        /** @type {string} */
        collection,
        /** @type {string} */
        knowledgeType,
        /** @type {boolean} */
        open = false,
        /** @type {boolean} */
        disabled = false,
        /** @type {(data: { id: string }) => void} */
        ondelete = () => {},
        /** @type {(data: { collection: string, item: any }) => void} */
        onupdate = () => {}
    } = $props();

    const excludedPayloads = [
		KnowledgePayloadName.Text,
		KnowledgePayloadName.Question,
		KnowledgePayloadName.Answer
	];

    let isQuestionAnswerCollection = $derived(knowledgeType === KnowledgeBaseType.QuestionAnswer);
    let isDocumentCollection = $derived(knowledgeType === KnowledgeBaseType.Document);

    let isLoading = $state(false);
    let loadMore = $state(false);

    $effect(() => {
        if (!open) {
            loadMore = false;
        }
    });

    function toggleKnowledgeDetail() {
        open = !open;
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
                ondelete?.({ id: id });
            }
        });
    }

    function editKnowledge() {
        onupdate?.({
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
        <div class="ellipsis">{item?.payload?.text?.data_value || item?.payload?.question?.data_value || ''}</div>
    </td>
    {#if isQuestionAnswerCollection}
        <td class="knowledge-text-qa">
            <div class="ellipsis">{item?.payload?.answer?.data_value || ''}</div>
        </td>
    {/if}
    <td class="knowledge-op">
        <ul class="list-unstyled hstack gap-1 mb-0 knowledge-op-list">
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="View Detail">
                <button
                    class="btn btn-sm btn-soft-primary"
                    aria-label="View detail"
                    onclick={() => toggleKnowledgeDetail()}
                >
                    {#if open}
                        <i class="bx bx-hide"></i>
                    {:else}
                        <i class="mdi mdi-eye-outline"></i>
                    {/if}
                </button>
            </li>
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="Edit">
                <button
                    class="btn btn-sm btn-soft-warning"
                    disabled={disabled}
                    aria-label="Edit"
                    onclick={() => editKnowledge()}
                >
                    <i class="bx bxs-edit"></i>
                </button>
            </li>
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="Delete">
                <button
                    class="btn btn-sm btn-soft-danger"
                    disabled={disabled}
                    aria-label="Delete"
                    onclick={() => deleteKnowledge(item?.id)}
                >
                    <i class="mdi mdi-delete-outline"></i>
                </button>
            </li>
        </ul>
    </td>
</tr>

{#if open}
    <tr in:fly={{ y: -5, duration: 800 }} out:fly={{ y: -5, duration: 300 }}>
        <td colspan="12">
            <div class="knowledge-detail">
                <ul>
                    {#if isQuestionAnswerCollection}
                        <li>
                            <div class="wrappable fw-bold text-primary">
                                {'Question:'}
                            </div>
                            <div class="wrappable">{item?.payload?.text?.data_value || item?.payload?.question?.data_value || ''}</div>
                        </li>
                        <li>
                            <div class="wrappable fw-bold text-primary">
                                {'Answer:'}
                            </div>
                            <div class="wrappable">{item?.payload?.answer?.data_value || ''}</div>
                        </li>
                    {:else if isDocumentCollection}
                        <li>
                            <div class="wrappable fw-bold text-primary">
                                {'Text:'}
                            </div>
                            <div class="wrappable">{item?.payload?.text?.data_value || ''}</div>
                        </li>
                    {/if}

                    {#if item?.score}
                        <li>
                            <div class="wrappable fw-bold text-primary">
                                {'Score:'}
                            </div>
                            <div class="wrappable">{`${item.score?.toFixed(6)}`}</div>
                        </li>
                    {/if}
                </ul>
                {#if item?.id}
                    <div class="more-detail">
                        <button class="toggle-btn btn btn-sm btn-link" onclick={() => loadMore = !loadMore}>
                            {`${loadMore ? 'Less -' : 'More +'}`}
                        </button>
                    </div>
                    {#if loadMore}
                        <ul
                            class="more-detail-list text-secondary"
                            in:fly={{ y: -5, duration: 300 }}
                            out:fly={{ y: -5, duration: 200 }}
                        >
                            <li class="more-detail-item wrappable">
                                Data point id: {item?.id || ''}
                            </li>
                            {#if item?.vector_dimension}
                                <li class="more-detail-item wrappable">
                                    Vector dimension: {item?.vector_dimension}
                                </li>
                            {/if}
                            {#if item?.payload}
                                {#each Object.keys(item.payload) as key (`${key}-${item?.id}`)}
                                    {#if (!excludedPayloads.includes(key))}
                                        <li class="more-detail-item wrappable">
                                            <span>{key} {`(${item.payload[key]?.data_type?.toLowerCase()})`}: </span>
                                            {#if key === KnowledgePayloadName.FileUrl}
                                                <button
                                                    class="link clickable btn btn-link p-0"
                                                    onclick={() => window.open(item.payload[key]?.data_value)}
                                                >
                                                    link
                                                </button>
                                            {:else}
                                                <span>{item.payload[key]?.data_value}</span>
                                            {/if}
                                        </li>
                                    {/if}
                                {/each}
                            {/if}
                        </ul>
                    {/if}
                {/if}
            </div>
        </td>
    </tr>
{/if}