<script>
	import { createEventDispatcher, onMount } from 'svelte';
    import { fly } from 'svelte/transition';
    import { Button, Input } from '@sveltestrap/sveltestrap';
    import Swal from 'sweetalert2';
	import InPlaceEdit from '$lib/common/InPlaceEdit.svelte';
	import { UserAction } from '$lib/helpers/enums';
    import { v4 as uuidv4 } from 'uuid';

    const svelteDispatch = createEventDispatcher();

    const allActions = [
        UserAction.Edit,
        UserAction.Chat
    ];

    const colStyle = `flex: 0 0 ${allActions.length > 2 ? Math.floor(1 / (allActions.length + 1) * 100) - 1 : 32}%;`;

    /** @type {import('$userTypes').UserModel} */
    export let item;

    /** @type {boolean} */
    export let open = true;

    /** @type {boolean} */
    export let disabled = false;

    /** @type {import('$commonTypes').IdName[]} */
    export let agents = [];


    /** @type {import('$userTypes').UserModel} */
    let innerItem = { ...item };

    /** @type {any[]} */
    let innerActions = [];

    onMount(() => {
        initInnerItem();
        initAgentActions();
    });

    /** @param {import('$userTypes').UserAgentAction[]} agent_actions  */
    function formatAgentActions(agent_actions) {
        const validAgents = agent_actions?.filter(x => !!x.agent)?.map(x => x.agent?.name) || [];
        return validAgents.join(", ");
    }

    function initInnerItem() {
        innerItem = { ...item };
    }

    function initAgentActions() {
        const agentActions = innerItem.agent_actions || [];
        const handledActions = agents.map(x => {
            const found = agentActions.find(a => a.agent_id === x.id);
            if (!found) {
                return {
                    id: null,
                    agentId: x.id,
                    agentName: x.name,
                    actions: allActions.map(a => {
                        return {
                            key: uuidv4(),
                            value: a,
                            displayName: a,
                            checked: false
                        };
                    })
                }
            }

            const actions = allActions.map(a => {
                const checked = !!found.actions.find(y => y === a) || false;
                return {
                    key: uuidv4(),
                    value: a,
                    displayName: a,
                    checked: checked
                };
            });

            return {
                id: found.id,
                agentId: x.id,
                agentName: x.name,
                actions: actions
            }
        });

        innerActions = handledActions.filter(Boolean);
        console.log(innerActions);
    }

    function toggleUserDetail() {
        open = !open;
        if (open) {
            initAgentActions();
        }
    }

    /**
	 * @param {any} e
	 * @param {any} agentActionItem
	 * @param {any} actionItem
	 */
    function checkAction(e, agentActionItem, actionItem) {
        const checked = e.target.checked;
        const found = innerActions.find(x => x.agentId === agentActionItem.agentId);
        // @ts-ignore
        const action = found?.actions?.find(x => x.key === actionItem.key);
        if (action) {
            action.checked = checked;
        }
        
        console.log(found);
    }

    /** @param {string} id */
    function save(id) {
        if (!id) return;

        Swal.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to update user ${item.user_name}?`,
            icon: 'warning',
            showCancelButton: true,
            cancelButtonText: 'No',
            confirmButtonText: 'Yes'
        }).then(async (result) => {
            if (result.value) {
                svelteDispatch("save", {
                    user: innerItem
                });
            }
        });
    }
</script>

<tr in:fly={{ y: -5, duration: 800 }}>
    <td>{item.user_name}</td>
    <td>{item.full_name}</td>
    <td>{item.external_id}</td>
    <td class="user-plain-col">
        <div class="ellipsis">{item.role}</div>
    </td>
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
                            <span>{item.user_name}</span>
                        </div>
                    </li>
                    {#if item.full_name}
                    <li>
                        <div class="wrappable">
                            <span class="fw-bold text-primary">{'Full name:'}</span>
                            <span>{item.full_name}</span>
                        </div>
                    </li>
                    {/if}
                    {#if item.role}
                    <li>
                        <div class="wrappable inline-edit">
                            <div class="fw-bold text-primary line-align-center">{'Role:'}</div>
                            <div><InPlaceEdit bind:value={innerItem.role} maxLength={15} /></div>
                        </div>
                    </li>
                    {/if}
                    {#if item.source}
                    <li>
                        <div class="wrappable">
                            <span class="fw-bold text-primary">{'Source:'}</span>
                            <span>{item.source}</span>
                        </div>
                    </li>
                    {/if}
                    {#if item.type}
                    <li>
                        <div class="wrappable">
                            <span class="fw-bold text-primary">{'Type:'}</span>
                            <span>{item.type}</span>
                        </div>
                    </li>
                    {/if}
                    {#if item.permissions}
                    <li>
                        <div class="wrappable">
                            <span class="fw-bold text-primary">{'Permissions:'}</span>
                            <span>{item.permissions?.length > 0 ? item.permissions.join(', ') : 'N/A'}</span>
                        </div>
                    </li>
                    {/if}
                </ul>
                {#if innerActions.length > 0}
                <ul>
                    <li>
                        <div class="fw-bold text-primary">{'Agent actions:'}</div>
                    </li>
                </ul>
                <div class="user-agent-container">
                    <div class="action-row action-title">
                        <div class="action-col action-title-text fw-bold" style={colStyle}>
                            {''}
                        </div>
                        {#each allActions as title}
                            <div class="action-col action-title-text fw-bold" style={colStyle}>
                                {title}
                            </div>
                        {/each}
                    </div>
                    <div class="action-row-wrapper">
                        {#each innerActions as agentActionItem}
                            <div class="action-row">
                                <div class="action-col fw-bold" style={colStyle}>
                                    {agentActionItem.agentName}
                                </div>
                                {#each agentActionItem.actions as actionItem}
                                    <div class="action-col action-center" style={colStyle}>
                                        <Input
                                            type="checkbox"
                                            class="action-center"
                                            checked={actionItem.checked}
                                            on:change={e => checkAction(e, agentActionItem, actionItem)}
                                        />
                                    </div>
                                {/each}
                            </div>
                        {/each}
                    </div>
                </div>
                {/if}
                <div class="edit-btn">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div
                        class="text-primary clickable"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        title="Save"
                        on:click={() => save(item.id)}
                    >
                        <i class="mdi mdi-content-save-all" />
                    </div>
                </div>
            </div>
        </td>
    </tr>
{/if}