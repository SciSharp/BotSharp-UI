<script>
  import LoadingDots from '$lib/common/LoadingDots.svelte';
	import KnowledgeSearchItem from './knowledge-search-item.svelte';
  
  /** @type {import('$types').KnowledgeRetrivalViewModel[]} */
  export let list;

  /** @type {boolean} */
  export let isSearching = false;

  /** @type {boolean} */
  export let searchDone = false;
</script>

<div class="knowledge-search-result-container">
  {#if list?.length > 0}
    <ul>
      {#each list as item, idx (idx)}
        <KnowledgeSearchItem item={item} open={idx === 0} />
      {/each}
    </ul>
  {:else if isSearching}
    <div class="knowledge-loader mt-4">
      <LoadingDots duration={'1s'} size={12} gap={5} color={'var(--bs-primary)'} />
    </div>
  {:else if searchDone}
    <div class="mt-2">
      <h3 class="text-secondary">{"Ehhh, no idea..."}</h3>
    </div>
  {/if}
</div>