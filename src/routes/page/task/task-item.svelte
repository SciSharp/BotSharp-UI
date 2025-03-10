<script>
    import { createEventDispatcher } from 'svelte';
    import { _ } from 'svelte-i18n';
    import { Button } from "@sveltestrap/sveltestrap";
	import { utcToLocal } from "$lib/helpers/datetime";
	import { replaceNewLine } from "$lib/helpers/http";

    const svelteDispatch = createEventDispatcher();

    /** @type {import('$agentTypes').AgentTaskModel} */
    export let task;

    /** @type {boolean} */
    export let disabled = false;

    function toggleTask() {
        task.enabled = !task.enabled;
    }

    function handleSaveTask() {
        svelteDispatch("save", {
            task: task
        });
    }

    function handleDeleteTask() {
        svelteDispatch("delete", {
            task: task
        });
    }
</script>

<tr>
    <td scope="row" class="text-primary">{task.name}</td>
    <td>{task.description}</td>
    <td>{task.agent_name}</td>
    <td><div style="max-height: 100px;" class="scrollbar">{@html replaceNewLine(task.content)}</div></td>
    <td>{utcToLocal(task.updated_time)}</td>
    <td>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <span class="clickable" on:click={() => toggleTask()}>
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
                <a href="page/task/{task.id}?agentId={task.agent_id}" target="_blank" class="btn btn-sm btn-soft-primary">
                    <i class="mdi mdi-eye-outline" />
                </a>
            </li>
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="Save">
                <Button on:click={() => handleSaveTask()} class="btn btn-sm btn-soft-info">
                    <i class="mdi mdi-content-save-all" />
                </Button>
            </li>
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="Delete">
                <Button on:click={() => handleDeleteTask()} class="btn btn-sm btn-soft-danger">
                    <i class="mdi mdi-delete-outline" />
                </Button>
            </li>
        </ul>
    </td>
</tr>