<script>
  import JSONTree from 'svelte-json-tree';

  /** @type {import('$conversationTypes').ConversationStateLogModel?} */
  export let data;
</script>

<div class="log-element state-log-item">
  <div class="log-content">
    <JSONTree
      value={data?.states || {}}
      defaultExpandedLevel={1}
      --json-tree-property-color="white"
      --json-tree-string-color="var(--bs-info)"
    />
  </div>
</div>