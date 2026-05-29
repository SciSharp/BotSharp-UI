<script>
    import { fly } from 'svelte/transition';
	import Markdown from '$lib/common/markdown/Markdown.svelte';
	import { utcToLocal } from '$lib/helpers/datetime';
    import JSONTree from 'svelte-json-tree';
    import { formatObject } from '$lib/helpers/utils/common';

    /**
     * @type {{
     *   item: import('$instructTypes').InstructionLogModel
     * }}
     */
    let { item } = $props();

    /** @type {boolean} */
    let open = $state(false);

    function toggleLogDetail() {
        open = !open;
    }
</script>

<tr in:fly={{ y: -5, duration: 800 }} class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40">
    <td class="instruction-log-col" title={item.agent_name ?? ''}>
        {#if item.agent_name}
            <span class="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <i class="mdi mdi-robot-outline text-sm leading-none"></i>
                <span class="truncate">{item.agent_name}</span>
            </span>
        {:else}
            <span class="text-muted italic">N/A</span>
        {/if}
    </td>
    <td class="instruction-log-col" title={item.provider ?? ''}>
        {#if item.provider}
            <span class="inline-flex items-center rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">{item.provider}</span>
        {:else}
            <span class="text-muted italic">—</span>
        {/if}
    </td>
    <td class="instruction-log-col" title={item.model ?? ''}>
        {#if item.model}
            <span class="font-mono text-xs text-dark dark:text-gray-100">{item.model}</span>
        {:else}
            <span class="text-muted italic">—</span>
        {/if}
    </td>
    <td class="instruction-log-col" title={item.template_name ?? ''}>
        {#if item.template_name}
            <span class="font-mono text-xs text-dark dark:text-gray-100">{item.template_name}</span>
        {:else}
            <span class="text-muted italic">N/A</span>
        {/if}
    </td>
    <td class="instruction-log-col" title={item.user_name ?? ''}>
        {#if item.user_name}
            <div class="flex items-center gap-2">
                <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.65rem] font-semibold uppercase text-primary">
                    {item.user_name.charAt(0)}
                </span>
                <span class="truncate text-dark dark:text-gray-100">{item.user_name}</span>
            </div>
        {:else}
            <span class="text-muted italic">N/A</span>
        {/if}
    </td>
    <td class="instruction-log-col">
        <span class="text-xs text-muted">{utcToLocal(item.created_time, 'MMM D YYYY, hh:mm:ss A')}</span>
    </td>
    <td>
        <div class="flex justify-start">
            <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-warning/15 text-warning transition-all cursor-pointer hover:scale-105 hover:bg-warning/25"
                aria-label={open ? 'Collapse' : 'Detail'}
                title={open ? 'Collapse' : 'Detail'}
                onclick={() => toggleLogDetail()}
            >
                <i class="mdi {open ? 'mdi-chevron-up' : 'mdi-eye-outline'}"></i>
            </button>
        </div>
    </td>
</tr>


{#if open}
    <tr in:fly={{ y: -5, duration: 800 }} out:fly={{ y: -5, duration: 300 }}>
        <td colspan="12" class="!whitespace-normal !p-3">
            <div class="relative flex flex-col gap-4 rounded-lg border-l-4 border-primary bg-primary/5 p-5 dark:bg-primary/10">
                {#if !!item.system_instruction}
                <div>
                    <div class="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                        <i class="mdi mdi-cog-outline text-base leading-none"></i>
                        System instruction
                    </div>
                    <div class="thin-scrollbar max-h-[350px] overflow-y-auto rounded-md border border-gray-100 bg-white p-3 text-xs leading-relaxed text-dark dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                        <div contenteditable="false" bind:innerText={item.system_instruction}></div>
                    </div>
                </div>
                {/if}
                {#if !!item.user_message}
                <div>
                    <div class="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                        <i class="mdi mdi-message-text-outline text-base leading-none"></i>
                        User message
                    </div>
                    <div class="thin-scrollbar max-h-[350px] overflow-y-auto rounded-md border border-gray-100 bg-white p-3 text-xs leading-relaxed text-dark dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                        <div contenteditable="false" bind:innerText={item.user_message}></div>
                    </div>
                </div>
                {/if}
                {#if !!item.completion_text}
                <div>
                    <div class="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                        <i class="mdi mdi-robot-happy-outline text-base leading-none"></i>
                        Completion text
                    </div>
                    <div class="thin-scrollbar max-h-[350px] overflow-y-auto rounded-md border border-gray-100 bg-white p-3 text-xs leading-relaxed text-dark dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                        <Markdown containerClasses={'markdown-dark text-dark'} text={item.completion_text} rawText />
                    </div>
                </div>
                {/if}
                {#if item.states}
                <div>
                    <div class="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                        <i class="mdi mdi-database-outline text-base leading-none"></i>
                        States
                    </div>
                    <div class="instruction-log-state thin-scrollbar max-h-[350px] overflow-y-auto rounded-md border border-gray-100 bg-white p-3 text-xs dark:border-gray-700 dark:bg-gray-800">
                        <JSONTree
                            value={formatObject(item.states)}
                            defaultExpandedLevel={1}
                            --json-tree-font-family="var(--font-sans)"
                            --json-tree-number-color="var(--color-info)"
                            --json-tree-boolean-color="var(--color-info)"
                            --json-tree-string-color="var(--color-info)"
                        />
                    </div>
                </div>
                {/if}
            </div>
        </td>
    </tr>
{/if}

