<script>
    import { createEventDispatcher } from "svelte";
    import { Button } from "@sveltestrap/sveltestrap";
    import { fly } from 'svelte/transition';
    import { deleteVectorKnowledgeData } from "$lib/services/knowledge-base-service";
    import Swal from 'sweetalert2/dist/sweetalert2.js';
    import "sweetalert2/src/sweetalert2.scss";
	import Loader from "$lib/common/Loader.svelte";

    const svelteDispatch = createEventDispatcher();

    /** @type {import('$types').KnowledgeSearchViewModel} */
    export let data;

    /** @type {boolean} */
    export let open = false;

    let isLoading = false;

    function toggleItem() {
        open = !open;
    }

    /** @param {string} id */
    function deleteKnowledge(id) {
        if (!id) return;

        // @ts-ignore
        Swal.fire({
            title: 'Are you sure?',
            text: "Are you sure you want to delete this knowledge?",
            icon: 'warning',
            showCancelButton: true,
            cancelButtonText: 'No',
            confirmButtonText: 'Yes'
        // @ts-ignore
        }).then(async (result) => {
            if (result.value) {
                isLoading = true;
                deleteVectorKnowledgeData(id).then(res => {
                if (res) {
                    dispatchDeleteEvent(id, res);
                    isLoading = false;
                }
                }).catch(() => {
                    dispatchDeleteEvent(id, false);
                    isLoading = false;
                });
            }
        });
    }

    
    /**
	 * @param {string} id
	 * @param {boolean} isSuccess
	 */
    function dispatchDeleteEvent(id, isSuccess) {
        svelteDispatch("delete", {
            id: id,
            isSuccess: isSuccess
        });
    }
</script>

{#if isLoading}
    <Loader />
{/if}

<tr in:fly={{ y: -5, duration: 800 }}>
    <td class="knowledge-text">
        <div class="ellipsis">{data?.data?.question || data?.data?.text || ''}</div>
    </td>
    <td class="knowledge-text">
        <div class="ellipsis">{data?.data?.answer || ''}</div>
    </td>
    <td class="knowledge-op">
        <ul class="list-unstyled hstack gap-1 mb-0 knowledge-op-list">
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="View Detail">
                <Button
                    class="btn btn-sm btn-soft-primary"
                    on:click={() => toggleItem()}
                >
                    {#if open}
                        <i class="bx bx-hide" />
                    {:else}
                        <i class="mdi mdi-eye-outline" />
                    {/if}
                </Button>
            </li>
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="Delete">
                <Button
                    class="btn btn-sm btn-soft-danger"
                    on:click={() => deleteKnowledge(data?.id)}
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
            {#if data?.data?.question || data?.data?.text}
                <li>
                    <div class="wrappable fw-bold text-primary">Question:</div>
                    <div class="wrappable">{data?.data?.question || data?.data?.text || ''}</div>
                </li>
            {/if}
            {#if data?.data?.answer}
                <li>
                    <div class="wrappable fw-bold text-primary">Answer:</div>
                    <div class="wrappable">{data?.data?.answer || ''}</div>
                </li>
            {/if}
            {#if data?.score}
                <li>
                    <div class="wrappable fw-bold text-primary">Score:</div>
                    <div class="wrappable">{data?.score?.toFixed(6)}</div>
                </li>
            {/if}
            </ul>
            {#if data?.id}
                <ul class="knwoledge-id">
                    <div class="wrappable text-secondary">
                        <span>(<span>Id: {data?.id || ''}</span>)</span>
                    </div>
                </ul>
            {/if}
        </div>
    </td>
</tr>
{/if}