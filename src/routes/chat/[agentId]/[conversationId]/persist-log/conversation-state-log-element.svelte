<script>
    import JSONTree from 'svelte-json-tree';
    import { formatObject } from '$lib/helpers/utils/common';

    /** @type {{ data: any }} */
    let { data } = $props();
</script>

<!--
  NOTE: .state-log-item and .log-content are DOM hooks queried by
  chat-box.svelte's highlightStateLog(); the #state-log-{id} id is queried
  by autoScrollToTargetLog(). Keep those names exactly. Scoped styling
  is applied through .csle-* siblings.
-->
<div class="csle-element state-log-item" id={`state-log-${data.message_id}`}>
    <div class="csle-content log-content">
        <JSONTree
            value={formatObject(data?.states)}
            --json-tree-font-family="var(--font-code)"
            --json-tree-property-color="white"
            --json-tree-label-color="white"
            --json-tree-number-color="var(--color-info, #0ea5e9)"
            --json-tree-boolean-color="var(--color-info, #0ea5e9)"
            --json-tree-string-color="var(--color-info, #0ea5e9)"
        />
    </div>
    {#if data.message_id}
        <div class="csle-msg-id">
            {`Message id: ${data.message_id}`}
        </div>
    {/if}
</div>

