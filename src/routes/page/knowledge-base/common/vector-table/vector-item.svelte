<script>
    import { fly } from 'svelte/transition';
    import ConfirmModal from '$lib/common/modals/ConfirmModal.svelte';
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

    let confirmOpen = $state(false);
    /** @type {string | null} */
    let pendingDeleteId = $state(null);

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
        pendingDeleteId = id;
        confirmOpen = true;
    }

    function closeConfirm() {
        confirmOpen = false;
        pendingDeleteId = null;
    }

    function onConfirmDelete() {
        const id = pendingDeleteId;
        closeConfirm();
        if (id) {
            ondelete?.({ id });
        }
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

<ConfirmModal
    isOpen={confirmOpen}
    icon="warning"
    title="Are you sure?"
    text="Are you sure you want to delete this knowledge?"
    confirmBtnText="Yes"
    cancelBtnText="No"
    confirmBtnColor="danger"
    confirm={onConfirmDelete}
    cancel={closeConfirm}
    toggleModal={closeConfirm}
/>

<tr in:fly={{ y: -5, duration: 800 }}>
    <td class={`vti-text-qa ${isDocumentCollection ? 'vti-text' : ''}`}>
        <div class="vti-ellipsis">{item?.payload?.text?.data_value || item?.payload?.question?.data_value || ''}</div>
    </td>
    {#if isQuestionAnswerCollection}
        <td class="vti-text-qa">
            <div class="vti-ellipsis">{item?.payload?.answer?.data_value || ''}</div>
        </td>
    {/if}
    <td class="vti-op">
        <ul class="vti-op-list">
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="View Detail">
                <button
                    type="button"
                    class="vti-icon-btn vti-icon-btn-primary"
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
                    type="button"
                    class="vti-icon-btn vti-icon-btn-warning"
                    disabled={disabled}
                    aria-label="Edit"
                    onclick={() => editKnowledge()}
                >
                    <i class="bx bxs-edit"></i>
                </button>
            </li>
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="Delete">
                <button
                    type="button"
                    class="vti-icon-btn vti-icon-btn-danger"
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
            <div class="vti-detail">
                <ul>
                    {#if isQuestionAnswerCollection}
                        <li>
                            <div class="vti-wrappable vti-detail-label">
                                {'Question:'}
                            </div>
                            <div class="vti-wrappable">{item?.payload?.text?.data_value || item?.payload?.question?.data_value || ''}</div>
                        </li>
                        <li>
                            <div class="vti-wrappable vti-detail-label">
                                {'Answer:'}
                            </div>
                            <div class="vti-wrappable">{item?.payload?.answer?.data_value || ''}</div>
                        </li>
                    {:else if isDocumentCollection}
                        <li>
                            <div class="vti-wrappable vti-detail-label">
                                {'Text:'}
                            </div>
                            <div class="vti-wrappable">{item?.payload?.text?.data_value || ''}</div>
                        </li>
                    {/if}

                    {#if item?.score}
                        <li>
                            <div class="vti-wrappable vti-detail-label">
                                {'Score:'}
                            </div>
                            <div class="vti-wrappable">{`${item.score?.toFixed(6)}`}</div>
                        </li>
                    {/if}
                </ul>
                {#if item?.id}
                    <div class="vti-more-detail">
                        <button type="button" class="vti-link-btn" onclick={() => loadMore = !loadMore}>
                            {`${loadMore ? 'Less -' : 'More +'}`}
                        </button>
                    </div>
                    {#if loadMore}
                        <ul
                            class="vti-more-detail-list"
                            in:fly={{ y: -5, duration: 300 }}
                            out:fly={{ y: -5, duration: 200 }}
                        >
                            <li class="vti-more-detail-item vti-wrappable">
                                Data point id: {item?.id || ''}
                            </li>
                            {#if item?.vector_dimension}
                                <li class="vti-more-detail-item vti-wrappable">
                                    Vector dimension: {item?.vector_dimension}
                                </li>
                            {/if}
                            {#if item?.payload}
                                {#each Object.keys(item.payload) as key (`${key}-${item?.id}`)}
                                    {#if (!excludedPayloads.includes(key))}
                                        <li class="vti-more-detail-item vti-wrappable">
                                            <span>{key} {`(${item.payload[key]?.data_type?.toLowerCase()})`}: </span>
                                            {#if key === KnowledgePayloadName.FileUrl}
                                                <button
                                                    type="button"
                                                    class="vti-link"
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




