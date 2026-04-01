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

<tr>
    <td class="text-primary">{task.name}</td>
    <td>{task.description}</td>
    <td>{task.agent_name}</td>
    <td><div style="max-height: 100px;" class="scrollbar">{@html replaceNewLine(task.content)}</div></td>
    <td>{utcToLocal(task.updated_time)}</td>
    <td>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span class="clickable" onclick={() => toggleTask()}>
            {#if task.enabled}
                <span class="badge bg-success">{$_("Enabled")}</span>
            {:else}
                <span class="badge bg-danger">{$_("Disabled")}</span>
            {/if}
        </span>
    </td>
    <td><span class="badge bg-info">{task.status}</span></td>
    <td>
        <ul class="list-unstyled hstack gap-1 mb-0">
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="View">
                <a href="page/task/{task.id}?agentId={task.agent_id}" target="_blank" class="btn btn-sm btn-soft-primary" aria-label="View">
                    <i class="mdi mdi-eye-outline"></i>
                </a>
            </li>
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="Save">
                <button type="button" onclick={() => handleSaveTask()} class="btn btn-sm btn-soft-info" aria-label="Save">
                    <i class="mdi mdi-content-save-all"></i>
                </button>
            </li>
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="Delete">
                <button type="button" onclick={() => handleDeleteTask()} class="btn btn-sm btn-soft-danger" aria-label="Delete">
                    <i class="mdi mdi-delete-outline"></i>
                </button>
            </li>
        </ul>
    </td>
</tr>