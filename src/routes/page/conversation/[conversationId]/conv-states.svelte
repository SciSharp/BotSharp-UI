<script>
    import JSONTree from 'svelte-json-tree';
	import { formatObject } from '$lib/helpers/utils/common';

    /** @type {{ conversation: import('$conversationTypes').ConversationModel }} */
    let { conversation } = $props();
</script>

<div class="card">
    <div class="card-body">
        <h4 class="card-title mb-5">States</h4>
        <div class="conv-states-tree">
            <JSONTree
                value={formatObject(conversation.states)}
                defaultExpandedLevel={1}
                --json-tree-number-color="var(--bs-info)"
                --json-tree-boolean-color="var(--bs-info)"
                --json-tree-string-color="var(--bs-info)"
            />
        </div>
    </div>
</div>

<style>
    .conv-states-tree :global(ul) {
        font-size: 15px;
    }
</style>