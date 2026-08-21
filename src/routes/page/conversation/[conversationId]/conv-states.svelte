<script>
    import JSONTree from 'svelte-json-tree';
	import { formatObject } from '$lib/helpers/utils/common';

    /** @type {{ conversation: import('$conversationTypes').ConversationModel }} */
    let { conversation } = $props();
</script>

<div class="rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
    <div class="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
        <div class="flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-info/10 text-info">
                <i class="mdi mdi-database-outline text-xl"></i>
            </span>
            <div>
                <h4 class="mb-0 text-base font-semibold text-dark dark:text-gray-100">States</h4>
                <p class="mb-0 text-xs text-muted">Conversation state snapshot</p>
            </div>
        </div>
    </div>
    <div class="p-4 sm:p-6 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <div class="conv-states-tree thin-scrollbar max-h-[400px] overflow-auto rounded-lg bg-gray-50 p-3 ring-1 ring-gray-100 dark:bg-gray-700/30 dark:ring-gray-700 lg:max-h-none lg:min-h-0 lg:flex-1">
            <JSONTree
                value={formatObject(conversation.states)}
                defaultExpandedLevel={1}
                --json-tree-font-family="var(--font-sans)"
                --json-tree-number-color="var(--color-info)"
                --json-tree-boolean-color="var(--color-info)"
                --json-tree-string-color="var(--color-info)"
            />
        </div>
    </div>
</div>

