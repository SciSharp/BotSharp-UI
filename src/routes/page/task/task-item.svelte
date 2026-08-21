<script>
    import { _ } from 'svelte-i18n';
	import { utcToLocal } from "$lib/helpers/datetime";
	import { replaceNewLine } from "$lib/helpers/http";

    /**
     * @type {{
     *   task: import('$agentTypes').AgentTaskModel,
     *   onsave?: (task: import('$agentTypes').AgentTaskModel) => void,
     *   ondelete?: (task: import('$agentTypes').AgentTaskModel) => void
     * }}
     */
    let {
        task,
        onsave,
        ondelete
    } = $props();

    function toggleTask() {
        task.enabled = !task.enabled;
    }

    function handleSaveTask() {
        onsave?.(task);
    }

    function handleDeleteTask() {
        ondelete?.(task);
    }
</script>

<tr class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40">
    <td>
        <span class="font-medium text-primary">{task.name}</span>
    </td>
    <td>
        <span class="text-dark dark:text-gray-100">{task.description || '—'}</span>
    </td>
    <td>
        {#if task.agent_name}
            <span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <i class="mdi mdi-robot-outline text-sm leading-none"></i>
                {task.agent_name}
            </span>
        {:else}
            <span class="text-muted italic">—</span>
        {/if}
    </td>
    <td class="!whitespace-normal">
        <div class="scrollbar max-h-[100px] max-w-md overflow-auto rounded-md bg-gray-50 p-2 text-xs leading-relaxed text-dark dark:bg-gray-700/50 dark:text-gray-100">
            {@html replaceNewLine(task.content)}
        </div>
    </td>
    <td>
        <span class="text-xs text-muted">{utcToLocal(task.updated_time)}</span>
    </td>
    <td>
        <button
            type="button"
            class="cursor-pointer"
            onclick={() => toggleTask()}
            aria-label={task.enabled ? 'Disable task' : 'Enable task'}
        >
            {#if task.enabled}
                <span class="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    <span class="h-1.5 w-1.5 rounded-full bg-success"></span>
                    {$_("Enabled")}
                </span>
            {:else}
                <span class="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                    <span class="h-1.5 w-1.5 rounded-full bg-danger"></span>
                    {$_("Disabled")}
                </span>
            {/if}
        </button>
    </td>
    <td>
        <span class="inline-flex items-center rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">{task.status}</span>
    </td>
    <td>
        <div class="flex items-center justify-start gap-1.5">
            <a
                href="page/task/{task.id}?agentId={task.agent_id}"
                target="_blank"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary transition-all hover:scale-105 hover:bg-primary/20"
                aria-label="View"
                title="View"
            >
                <i class="mdi mdi-eye-outline"></i>
            </a>
            <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-info/15 text-info transition-all cursor-pointer hover:scale-105 hover:bg-info/25"
                onclick={() => handleSaveTask()}
                aria-label="Save"
                title="Save"
            >
                <i class="mdi mdi-content-save-all"></i>
            </button>
            <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-danger/10 text-danger transition-all cursor-pointer hover:scale-105 hover:bg-danger/20"
                onclick={() => handleDeleteTask()}
                aria-label="Delete"
                title="Delete"
            >
                <i class="mdi mdi-delete-outline"></i>
            </button>
        </div>
    </td>
</tr>