<script>
  import JSONTree from 'svelte-json-tree';
  import { formatObject } from '$lib/helpers/utils/common';

  /** @type {{ data: Object | null }} */
  let { data } = $props();
</script>

<div class="lsl-element state-log-item">
  <div class="lsl-content log-content">
    {#if data}
      <JSONTree
        value={formatObject(data)}
        defaultExpandedLevel={1}
        --json-tree-font-family="var(--font-code)"
        --json-tree-property-color="white"
        --json-tree-label-color="white"
        --json-tree-number-color="var(--color-info, #0ea5e9)"
        --json-tree-boolean-color="var(--color-info, #0ea5e9)"
        --json-tree-string-color="var(--color-info, #0ea5e9)"
      />
    {/if}
  </div>
</div>

