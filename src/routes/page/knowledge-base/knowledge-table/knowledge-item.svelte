<script>
	import { deleteKnowledgeData } from "$lib/services/knowledge-base-service";
  import { Button } from "@sveltestrap/sveltestrap";
  import Swal from 'sweetalert2/dist/sweetalert2.js';
  import "sweetalert2/src/sweetalert2.scss";

  /** @type {import('$types').KnowledgeCollectionDataViewModel} */
  export let data;

  /** @type {(id: string, isSuccess: boolean) => void} */
  export let onDataDeleted = (id, isSuccess) => {};

  /** @type {boolean} */
  let open = false;

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
          deleteKnowledgeData(id).then(res => {
            if (res) {
              onDataDeleted?.(id, res);
            }
          }).catch(() => {
            onDataDeleted?.(id, false);
          });
        }
    });
  }
</script>

<tr>
  <td class="knowledge-text">
    <div class="ellipsis">{data?.question || ''}</div>
  </td>
  <td class="knowledge-text">
    <div class="ellipsis">{data?.answer || ''}</div>
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
<tr in:fade={}>
  <td colspan="3">
    <div class="knowledge-detail">
      <ul>
        {#if data?.question}
        <li>
          <div class="wrappable fw-bold text-primary">Question:</div>
          <div class="wrappable">{data?.question || ''}</div>
        </li>
        {/if}
        {#if data?.answer}
        <li>
          <div class="wrappable fw-bold text-primary">Answer:</div>
          <div class="wrappable">{data?.answer || ''}</div>
        </li>
        {/if}
      </ul>
    </div>
  </td>
</tr>
{/if}