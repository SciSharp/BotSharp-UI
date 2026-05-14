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

<style>
    /* ===== Cell sizing ===== */
    .vti-text {
        width: 70%;
    }
    .vti-text-qa {
        width: 40%;
        max-width: 50px;
    }
    .vti-op {
        width: 20%;
    }
    .vti-ellipsis {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* ===== Action buttons list ===== */
    .vti-op-list {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.3rem;
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .vti-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 1.875rem;
        width: 1.875rem;
        padding: 0;
        font-size: 0.875rem;
        line-height: 1;
        border: 1px solid transparent;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
    }
    .vti-icon-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .vti-icon-btn i {
        font-size: 1rem;
        line-height: 1;
    }
    .vti-icon-btn-primary {
        background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
        color: var(--color-primary);
    }
    .vti-icon-btn-primary:hover:not(:disabled) {
        background-color: var(--color-primary);
        color: rgb(255 255 255);
    }
    .vti-icon-btn-warning {
        background-color: color-mix(in srgb, var(--color-warning) 14%, transparent);
        color: var(--color-warning);
    }
    .vti-icon-btn-warning:hover:not(:disabled) {
        background-color: var(--color-warning);
        color: rgb(255 255 255);
    }
    .vti-icon-btn-danger {
        background-color: color-mix(in srgb, var(--color-danger) 12%, transparent);
        color: var(--color-danger);
    }
    .vti-icon-btn-danger:hover:not(:disabled) {
        background-color: var(--color-danger);
        color: rgb(255 255 255);
    }

    /* ===== Detail panel ===== */
    .vti-detail {
        padding: 0.5rem 0.75rem;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.5rem;
        background-color: rgb(249 250 251);
        position: relative;
        overflow-y: auto;
        scrollbar-width: thin;
        max-height: 300px;
    }
    .vti-detail ul {
        margin: 0.75rem 0;
        padding-left: 1.25rem;
    }
    .vti-detail ul li {
        margin: 0.3rem 0;
    }
    .vti-wrappable {
        white-space: normal !important;
        word-break: break-word;
    }
    .vti-detail-label {
        font-weight: 700;
        color: var(--color-primary);
    }

    .vti-more-detail {
        margin: 0.15rem 0;
        padding-left: 2rem;
    }
    .vti-link-btn {
        padding: 0;
        background: transparent;
        border: 0;
        color: var(--color-primary);
        font-size: 0.8125rem;
        cursor: pointer;
    }
    .vti-link-btn:hover {
        text-decoration: underline;
    }
    .vti-more-detail-list {
        margin: 0.125rem 0 0.95rem 0;
        font-size: 0.75rem;
        padding-left: 4rem;
        color: var(--color-muted);
    }
    .vti-more-detail-item {
        list-style-type: square;
    }
    .vti-link {
        padding: 0;
        background: transparent;
        border: 0;
        color: var(--color-primary);
        cursor: pointer;
    }
    .vti-link:hover {
        text-decoration: underline;
    }

    /* ===== Dark mode ===== */
    :global(.dark) .vti-detail {
        background-color: rgb(17 24 39);
        border-color: rgb(55 65 81);
        color: rgb(229 231 235);
    }
    :global(.dark) .vti-more-detail-list {
        color: rgb(156 163 175);
    }
</style>
