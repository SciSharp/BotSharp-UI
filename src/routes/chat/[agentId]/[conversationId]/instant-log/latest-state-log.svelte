<script>
  import JSONTree from 'svelte-json-tree';
  import { formatObject } from '$lib/helpers/utils/common';

  /** @type {{ data: Object | null }} */
  let { data } = $props();
</script>

<div class="log-element state-log-item">
  <div class="log-content">
    {#if data}
      <JSONTree
        value={formatObject(data)}
        defaultExpandedLevel={1}
        --json-tree-property-color="white"
        --json-tree-label-color="white"
        --json-tree-number-color="var(--bs-info)"
        --json-tree-boolean-color="var(--bs-info)"
        --json-tree-string-color="var(--bs-info)"
      />
    {/if}
  </div>
</div>