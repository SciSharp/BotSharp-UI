<script>
    import { onMount } from 'svelte';
    import { Button, Card, CardBody, CardHeader, Input, Table } from '@sveltestrap/sveltestrap';
    import InPlaceEdit from '$lib/common/InPlaceEdit.svelte'
    import { format } from '$lib/helpers/datetime';
	import { AgentType } from '$lib/helpers/enums';
	import { AgentExtensions } from '$lib/helpers/utils/agent';

    const limit = 10;


    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    /** @type {string[]} */
    export let profiles = [];

    /** @type {string[]} */
    export let labels = [];
    
    /** @type {() => void} */
    export let handleAgentChange;
   
    onMount(() => {});

    function addProfile() {
        if (!!!agent) return;

        profiles = [...profiles, ''];
        agent.profiles = profiles;
    }

    /**
	 * @param {number} index
	 */
    function removeProfile(index) {
        profiles = profiles.filter((x, idx) => idx !== index);
        agent.profiles = profiles;
    }

    function addLabel() {
        if (!!!agent) return;

        labels = [...labels, ''];
        agent.labels = labels;
    }

    /**
	 * @param {number} index
	 */
    function removeLabel(index) {
        labels = labels.filter((x, idx) => idx !== index);
        agent.labels = labels;
    }

    function chatWithAgent() {
        if (!!!agent?.id) return;
        
        window.open(`/chat/${agent?.id}`, '_blank');
    }
</script>

<Card>
    <CardHeader>
        <div class="text-center">
            <div class="agent-overview-header">
                <img
                    src="images/users/bot.png"
                    alt=""
                    height="50"
                    class="mx-auto d-block"
                />
                {#if !!AgentExtensions.chatable(agent)}
                    <Button
                        class="btn btn-sm btn-soft-info agent-chat"
                        on:click={() => chatWithAgent()}
                    >
                        <span>{'Chat with me'}</span>
                        <span><i class="mdi mdi-chat" /></span>
                    </Button>
                {/if}
            </div>
            <h5 class="mt-1 mb-1 div-center"><InPlaceEdit bind:value={agent.name} /></h5>
            <p class="text-muted mb-0">{`Updated at ${format(agent.updated_datetime, 'time')}`}</p>
        </div>
    </CardHeader>
    <CardBody>
        <div class="table-responsive">
            <Table >
                <tbody>
                    <tr>
                        <th class="agent-prop-key">Type</th>
                        <td>
                            {#if agent.type == AgentType.Routing}
                                Routing Agent
                            {:else if agent.type == AgentType.Planning}
                                Planning Agent
                            {:else if agent.type == AgentType.Evaluating}
                                Evaluation Agent
                            {:else if agent.type == AgentType.Static}
                                Static Agent
                            {:else if agent.type == AgentType.Task}
                                Task Agent
                            {:else}
                                Unkown
                            {/if}
                        </td>
                    </tr>
                    <tr>
                        <th class="agent-prop-key">Visibility</th>
                        <td>
                            <div class="form-check mb-3">
                                <input 
                                    class="form-check-input" 
                                    type="checkbox" 
                                    bind:checked={agent.is_public} 
                                    on:change={handleAgentChange}
                                    id="is_public" 
                                />
                                <label class="form-check-label" for="is_public"> Public </label>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th class="agent-prop-key">Routable</th>
                        <td>
                            <div class="form-check mb-3">
                                <input 
                                    class="form-check-input" 
                                    type="checkbox" 
                                    bind:checked={agent.allow_routing} 
                                    on:change={handleAgentChange}
                                    id="allow_routing" 
                                />
                                <label class="form-check-label" for="allow_routing">Allow</label>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th class="agent-prop-key">Profiles</th>
                        <td>
                            <div class="agent-prop-list-container vertical-flexible">
                                {#each profiles as profile, index}
                                <div class="edit-wrapper">
                                    <input
                                        class="form-control edit-text-box"
                                        type="text"
                                        placeholder="Typing here..."
                                        maxlength={30}
                                        bind:value={profile}
                                        on:input={handleAgentChange}
                                    />
                                    <div class="delete-icon">
                                        <i
                                            class="bx bxs-no-entry"
                                            role="link"
                                            tabindex="0"
                                            on:keydown={() => {}}
                                            on:click={() => { removeProfile(index); handleAgentChange(); }}
                                        />
                                    </div>
                                </div>
                                {/each}
                                {#if profiles?.length < limit}
                                <div class="list-add">
                                    <i
                                        class="bx bx bx-list-plus"
                                        role="link"
                                        tabindex="0"
                                        on:keydown={() => {}}
                                        on:click={() => { addProfile(); handleAgentChange(); }}
                                    />
                                </div>
                                {/if}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th class="agent-prop-key">Labels</th>
                        <td>
                            <div class="agent-prop-list-container vertical-flexible">
                                {#each labels as label, index}
                                <div class="edit-wrapper">
                                    <input
                                        class="form-control edit-text-box"
                                        type="text"
                                        placeholder="Typing here..."
                                        maxlength={30}
                                        bind:value={label}
                                        on:input={handleAgentChange}
                                    />
                                    <div class="delete-icon">
                                        <i
                                            class="bx bxs-no-entry"
                                            role="link"
                                            tabindex="0"
                                            on:keydown={() => {}}
                                            on:click={() => { removeLabel(index); handleAgentChange(); }}
                                        />
                                    </div>
                                </div>
                                {/each}
                                {#if labels?.length < limit}
                                <div class="list-add">
                                    <i
                                        class="bx bx bx-list-plus"
                                        role="link"
                                        tabindex="0"
                                        on:keydown={() => {}}
                                        on:click={() => { addLabel(); handleAgentChange(); }}
                                    />
                                </div>
                                {/if}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th class="agent-prop-key">Status</th>
                        <td>							
                            <div class="form-check mb-3">
                                <input 
                                    class="form-check-input" 
                                    type="checkbox" 
                                    bind:checked={agent.disabled} 
                                    on:change={handleAgentChange}
                                    id="disabled" 
                                />
                                <label class="form-check-label" for="disabled">Disabled</label>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th class="agent-prop-key">Max message count</th>
                        <td>							
                            <div class="mb-3">
                                <Input
                                    type="number"
                                    style="width: 50%; min-width: 100px;"
                                    class="text-center"
									min={1}
                                    max={1000}
									step={1}
                                    bind:value={agent.max_message_count}
                                    on:input={handleAgentChange}
                                />
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th class="agent-prop-key">Created Date</th>
                        <td>{format(agent.created_datetime, 'time')}</td>
                    </tr>
                </tbody>
            </Table>
        </div>
    </CardBody>
</Card>
