<script>
    import { createEventDispatcher } from "svelte";
    import { Button } from "@sveltestrap/sveltestrap";
    import { fly } from 'svelte/transition';
    import Swal from 'sweetalert2';
	import Loader from "$lib/common/Loader.svelte";
	import { KnowledgeCollectionType, KnowledgePayloadName } from "$lib/helpers/enums";
	import { splitTextByCase } from "$lib/helpers/utils/common";

    const svelteDispatch = createEventDispatcher();

    const excludedPayloads = [
		KnowledgePayloadName.Text,
		KnowledgePayloadName.Question,
		KnowledgePayloadName.Answer
	];

    /** @type {import('$knowledgeTypes').KnowledgeSearchViewModel} */
    export let item;

    /** @type {string} */
    export let collection;

    /** @type {string} */
    export let collectionType;

    /** @type {boolean} */
    export let open = false;

    /** @type {boolean} */
    export let disabled = false;

    $: isQuestionAnswerCollection = collectionType === KnowledgeCollectionType.QuestionAnswer;
    $: isDocumentCollection = collectionType === KnowledgeCollectionType.Document;
    $: {
        if (!open) {
            loadMore = false;
        }
    }

    let isLoading = false;
    let loadMore = false;

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
                    disabled={disabled}
                    on:click={() => editKnowledge()}
                >
                    <i class="bx bxs-edit" />
                </Button>
            </li>
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="Delete">
                <Button
                    class="btn btn-sm btn-soft-danger"
                    disabled={disabled}
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
        <td colspan="12">
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
                            <div class="wrappable">{`${item.score.toFixed(6)}`}</div>
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
                            {#if item?.data && Object.keys(item.data).length > 0}
                                {#each Object.keys(item.data) as key, idx (`${key}-${item?.id}`)}
                                    {#if key === KnowledgePayloadName.FileUrl}
                                        <li class="more-detail-item wrappable">
                                            <span>File url:</span>
                                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                                            <span
                                                class="link clickable"
                                                on:click={() => window.open(item?.data?.fileUrl)}
                                            >
                                                link
                                            </span>
                                        </li>
                                    {:else if (!excludedPayloads.includes(key))}
                                        <li class="more-detail-item wrappable">{key}: {item.data[key]}</li>
                                    {/if}
                                {/each}
                            {/if}
                            {#if item?.vector_dimension}
                                <li class="more-detail-item wrappable">Vector dimension: {item?.vector_dimension}</li>
                            {/if}
                        </ul>
                    {/if}
                {/if}
            </div>
        </td>
    </tr>
{/if}