<script>
	import KnowledgeSearchItem from './knowledge-search-item.svelte';
  
  /** @type {import('$types').KnowledgeRetrivalViewModel[]} */
  export let list;
</script>

<div class="knowledge-search-result-container">
  <ul>
    {#each list as item, idx (idx)}
      <KnowledgeSearchItem item={item} open={idx === 0} />
    {/each}
  </ul>
</div>