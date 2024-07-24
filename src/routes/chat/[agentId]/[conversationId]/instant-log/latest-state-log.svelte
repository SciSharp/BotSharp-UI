<script>
  import JSONTree from 'svelte-json-tree';

  /** @type {import('$types').ConversationStateLogModel?} */
  export let data;
</script>

<div class="log-element state-log-item">
  <div class="log-content">
    <JSONTree value={data?.states || {}} defaultExpandedLevel={1} />
  </div>
</div>