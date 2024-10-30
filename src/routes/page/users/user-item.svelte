<script>
	import { createEventDispatcher } from 'svelte';
    import { fly } from 'svelte/transition';
    import {
		Button
	} from '@sveltestrap/sveltestrap';
	import InPlaceEdit from '$lib/common/InPlaceEdit.svelte';
    

    const svelteDispatch = createEventDispatcher();

    /** @type {import('$userTypes').UserModel} */
    export let item;

    /** @type {boolean} */
    export let open = true;

    /** @type {boolean} */
    export let disabled = false;


    /** @param {import('$userTypes').UserAgentAction[]} agent_actions  */
    function formatAgentActions(agent_actions) {
        const validAgents = agent_actions?.filter(x => !!x.agent)?.map(x => x.agent?.name) || [];
        return validAgents.join(", ");
    }

    function toggleUserDetail() {
        open = !open;
    }

    function save() {
        console.log(item);
        svelteDispatch("save", {
            user: item
        });
    }
</script>

<tr in:fly={{ y: -5, duration: 800 }}>
    <td>{item.user_name}</td>
    <td>{item.full_name}</td>
    <td>{item.external_id}</td>
    <td>{item.role}</td>
    <td>{item.source}</td>
    <td class="user-permission-col">
        <div class="ellipsis">
            {item.permissions?.length > 0 ? item.permissions.join(', ') : 'N/A'}
        </div>
    </td>
    <td class="user-agent-col">
        <div class="ellipsis">
            {formatAgentActions(item.agent_actions)}
        </div>
    </td>
    <td>
        <ul class="list-unstyled hstack gap-1 mb-0" style="justify-content: center;">
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="Edit">
                <Button
                    class="btn btn-sm btn-soft-warning"
                    disabled={disabled}
                    on:click={() => toggleUserDetail()}
                >
                    <i class="bx bxs-edit" />
                </Button>
            </li>
        </ul>
    </td>
</tr>

{#if open}
    <tr in:fly={{ y: -5, duration: 800 }} out:fly={{ y: -5, duration: 300 }}>
        <td colspan="12">
            <div class="user-detail">
                <ul class="basic-info">
                    <li>
                        <div class="wrappable">
                            <span class="fw-bold text-primary">{'User name:'}</span>
                            <span>{`${item.user_name}`}</span>
                        </div>
                    </li>
                    {#if item.full_name}
                    <li>
                        <div class="wrappable">
                            <span class="fw-bold text-primary">{'Full name:'}</span>
                            <span>{`${item.full_name}`}</span>
                        </div>
                    </li>
                    {/if}
                    {#if item.role}
                    <li>
                        <div class="wrappable inline-edit">
                            <div class="fw-bold text-primary">{'Role:'}</div>
                            <div><InPlaceEdit bind:value={item.role} maxLength={15} /></div>
                        </div>
                    </li>
                    {/if}
                    {#if item.source}
                    <li>
                        <div class="wrappable">
                            <span class="fw-bold text-primary">{'Source:'}</span>
                            <span>{`${item.source}`}</span>
                        </div>
                    </li>
                    {/if}
                    {#if item.type}
                    <li>
                        <div class="wrappable">
                            <span class="fw-bold text-primary">{'Type:'}</span>
                            <span>{`${item.type}`}</span>
                        </div>
                    </li>
                    {/if}
                </ul>
                <div class="editable-info">
                    
                </div>
                <div class="edit-btn">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                     <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div
                        class="text-primary clickable"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Save"
                        on:click={() => save()}
                    >
                        <i class="mdi mdi-content-save-all" />
                    </div>
                </div>
            </div>
        </td>
    </tr>
{/if}