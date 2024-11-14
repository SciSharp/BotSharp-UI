<script>
	import { createEventDispatcher, onMount } from 'svelte';
    import { fly } from 'svelte/transition';
    import { Button, Input } from '@sveltestrap/sveltestrap';
    import { v4 as uuidv4 } from 'uuid';
    import Swal from 'sweetalert2';
    import lodash from "lodash";
    import Loader from '$lib/common/Loader.svelte';
	import { UserAction } from '$lib/helpers/enums';
    import { getUserDetails } from '$lib/services/user-service';
	

    const svelteDispatch = createEventDispatcher();


    /** @type {import('$userTypes').UserModel} */
    export let item;

    /** @type {boolean} */
    export let open = false;

    /** @type {boolean} */
    export let disabled = false;

    /** @type {import('$commonTypes').IdName[]} */
    export let agents = [];

    /** @type {string[]} */
    export let roleOptions = [];


    /** @type {boolean} */
    let isLoading = false;

    /** @type {import('$userTypes').UserModel} */
    let innerItem = { ...item };

    /** @type {import('$userTypes').UserAgentInnerAction[]} */
    let innerActions = [];

    let allActions = [
        {
            name: UserAction.Edit,
            value: UserAction.Edit,
            checked: false
        },
        {
            name: UserAction.Chat,
            value: UserAction.Chat,
            checked:false
        }
    ];

    const colStyle = `flex: 0 0 ${allActions.length > 2 ? Math.floor(1 / (allActions.length + 1) * 100) - 1 : 32}%;`;

    $: {
        allActions = allActions.map(x => {
            const list = innerActions.flatMap(a => a.actions.filter(y => y.value === x.value));
            x.checked = list.every(a => !!a.checked);
            return { ...x };
        });
    }

    onMount(() => {
        initInnerItem();
        initAgentActions();
    });

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
                    agent_id: x.id,
                    agent_name: x.name,
                    actions: allActions.map(a => {
                        return {
                            key: uuidv4(),
                            value: a.value,
                            checked: false
                        };
                    })
                }
            }

            const actions = allActions.map(a => {
                const checked = !!found.actions.find(y => y === a.value) || false;
                return {
                    key: uuidv4(),
                    value: a.value,
                    checked: checked
                };
            });

            return {
                id: found.id,
                agent_id: x.id,
                agent_name: x.name,
                actions: actions
            }
        });

        innerActions = handledActions.filter(Boolean);
    }

    function toggleUserDetail() {
        open = !open;
        if (open) {
            isLoading = true;
            getUserDetails(item.id).then(res => {
                innerItem = { ...res };
                initAgentActions();
            }).finally(() => {
                isLoading = false;
            });
        }
    }


    /** @param {any} e */
    function changeRole(e) {
        const value = e.target.value;
        innerItem = {
            ...innerItem,
            role: value
        };
    }

    /**
	 * @param {any} e
	 * @param {import('$userTypes').UserAgentInnerAction} agentActionItem
	 * @param {any} actionItem
	 */
    function checkAction(e, agentActionItem, actionItem) {
        const checked = e.target.checked;
        const found = innerActions.find(x => x.agent_id === agentActionItem.agent_id);
        // @ts-ignore
        const action = found?.actions?.find(x => x.key === actionItem.key);
        if (action) {
            action.checked = checked;
        }

        innerActions = [ ...innerActions ];
    }

    /**
	 * @param {any} e
     * @param {any} title
	 */
    function checkAll(e, title) {
        const checked = e.target.checked;
        allActions = allActions.map(x => {
            if (x.value === title.value) {
                x.checked = checked;
            }
            return { ...x };
        });

        innerActions = innerActions.map(x => {
            const actions = x.actions.map(a => {
                if (a.value === title.value) {
                    a.checked = checked;
                }
                return { ...a };
            });

            return {
                ...x,
                actions: actions
            };
        });
    }

    /** @param {string} id */
    function save(id) {
        if (!id) return;

        Swal.fire({
            title: 'Are you sure?',
            text: `Are you sure you want to update user "${item.user_name}"?`,
            icon: 'warning',
            showCancelButton: true,
            cancelButtonText: 'No',
            confirmButtonText: 'Yes'
        }).then(async (result) => {
            if (result.value) {
                const data = formatUpdatedData();
                svelteDispatch("save", {
                    updatedData: data
                });
            }
        });
    }

    function formatUpdatedData() {
        /** @type {any[]} */
        const list = [];
        innerActions.forEach(x => {
            // @ts-ignore
            const items = x.actions.filter(a => !!a.checked);
            if (x.id || items.length > 0) {
                list.push({
                    ...x,
                    // @ts-ignore
                    actions: items.map(i => i.value)
                });
            }
        });

        const updated = {
            ...innerItem,
            role: lodash.trim(innerItem.role),
            permissions: innerItem.permissions.filter(x => x?.length > 0),
            agent_actions: list
        };
        innerItem = { ...updated };
        return updated;
    }

    function addPermission() {
        innerItem = {
            ...innerItem,
            permissions: [ ...innerItem.permissions, '' ]
        };
    }

    /** @param {number} index */
    function deletePermission(index) {
        const permissions = innerItem.permissions.filter((_, idx) => idx !== index);
        innerItem = {
            ...innerItem,
            permissions: permissions
        };
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
        {#if isLoading}
            <td colspan="12">
                <Loader disableDefaultStyles size={30} containerStyles={'display: flex; justify-content: center;'} />
            </td>
        {:else}
            <td colspan="12">
                <div class="user-detail">
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
                        {#if item.type}
                        <li>
                            <div class="wrappable">
                                <span class="fw-bold text-primary">{'Type:'}</span>
                                <span>{item.type}</span>
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
                        {#if item.role}
                        <li>
                            <div class="wrappable inline-edit">
                                <div class="fw-bold text-primary line-align-center">{'Role:'}</div>
                                <div class="role-wrapper">
                                    <Input class="role-select" type="select" value={innerItem.role} on:change={e => changeRole(e)}>
                                        {#each roleOptions as option}
                                            <option value={option} selected={option == innerItem.role}>{option}</option>
                                        {/each}
                                    </Input>
                                </div>
                            </div>
                        </li>
                        {/if}
                    </ul>
                    <ul>
                        <li>
                            <div class="user-permission-container">
                                <div class="fw-bold text-primary">{'Permissions:'}</div>
                                <div class="permission-wrapper">
                                    {#each innerItem.permissions as permission, index}
                                        <div class="edit-wrapper">
                                            <Input
                                                type="text"
                                                class="edit-text-box"
                                                bind:value={permission}
                                            />
                                            <div class="line-align-center">
                                                <i
                                                    class="bx bxs-no-entry text-danger"
                                                    role="link"
                                                    tabindex="0"
                                                    on:keydown={() => {}}
                                                    on:click={() => deletePermission(index)}
                                                />
                                            </div>
                                        </div>
                                    {/each}
                                    {#if innerItem.permissions?.length < 5}
                                        <div class="list-add line-align-center">
                                            <i
                                                class="bx bx bx-list-plus text-primary clickable"
                                                role="link"
                                                tabindex="0"
                                                on:keydown={() => {}}
                                                on:click={() => addPermission()}
                                            />
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </li>
                    </ul>

                    {#if innerActions.length > 0}
                        <div class="user-agent-container">
                            <div class="action-row action-title">
                                <div class="action-col action-title-wrapper fw-bold" style={colStyle}>
                                    {'Agent'}
                                </div>
                                {#each allActions as title}
                                    <div class="action-col action-title-wrapper fw-bold" style={colStyle}>
                                        <div>{title.name}</div>
                                        <div>
                                            <Input
                                                type="checkbox"
                                                class="action-center"
                                                checked={title.checked}
                                                on:change={e => checkAll(e, title)}
                                            />
                                        </div>
                                    </div>
                                {/each}
                            </div>
                            <div class="action-row-wrapper">
                                {#each innerActions as agentActionItem}
                                    <div class="action-row">
                                        <div class="action-col fw-bold" style={colStyle}>
                                            {agentActionItem.agent_name}
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
                </div>
            </td>
        {/if}
    </tr>
{/if}