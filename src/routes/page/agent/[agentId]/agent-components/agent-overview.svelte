<script>
    import { onMount } from 'svelte';
    import { Button, Card, CardBody, CardHeader, Input, Table } from '@sveltestrap/sveltestrap';
    import { _ } from 'svelte-i18n';
    import InPlaceEdit from '$lib/common/InPlaceEdit.svelte';
    import Select from '$lib/common/Select.svelte';
    import { utcToLocal } from '$lib/helpers/datetime';
	import { RoutingMode, AgentType, FunctionVisMode } from '$lib/helpers/enums';
	import { AgentExtensions } from '$lib/helpers/utils/agent';

    const limit = 10;


    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    /** @type {string[]} */
    export let profiles = [];

    /** @type {string[]} */
    export let labels = [];
    
    /** @type {() => void} */
    export let handleAgentChange = () => {};

    /** @type {import('$commonTypes').IdName[]} */
	let routingModeOptions = Object.entries(RoutingMode).map(([k, v]) => (
		{ id: v, name: v }
	));

    const functionVisibilityModeOptions = Object.entries(FunctionVisMode).map(([k, v]) => (
		{ label: v, value: v }
	));
   
    onMount(() => {
        init();
    });

    function init() {
        routingModeOptions = [{ id: null, name: '' }, ...routingModeOptions];
    }
    
    function addProfile() {
        if (!!!agent) return;

        profiles = [...profiles, ''];
        agent.profiles = profiles;
        handleAgentChange();
    }

    /**
	 * @param {number} index
	 */
    function removeProfile(index) {
        profiles = profiles.filter((x, idx) => idx !== index);
        agent.profiles = profiles;
        handleAgentChange();
    }

    function addLabel() {
        if (!!!agent) return;

        labels = [...labels, ''];
        agent.labels = labels;
        handleAgentChange();
    }

    /**
	 * @param {number} index
	 */
    function removeLabel(index) {
        labels = labels.filter((x, idx) => idx !== index);
        agent.labels = labels;
        handleAgentChange();
    }

    /**
	 * @param {any} e
	 */
    function changeRoutingMode(e) {
        const value = e.target.value || null;
        agent.mode = value;
        handleAgentChange();
    }

    /**
	 * @param {any} e
	 */
    function changeFunctionVisibilityMode(e) {
        // @ts-ignore
        const values = e?.detail?.selecteds?.map(x => x.value) || [];
        agent.function_visibility_mode = values[0] || null;
        handleAgentChange();
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
            <h5 class="mt-1 mb-1 div-center">
                <InPlaceEdit bind:value={agent.name} on:input={handleAgentChange} />
            </h5>
            <p class="text-muted mb-0">{`Updated at ${utcToLocal(agent.updated_datetime)}`}</p>
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
                    {#if agent.is_router}
                    <tr>
                        <th class="agent-prop-key" style="vertical-align: middle">
                            <div class="mt-1">
                                Routing Mode
                            </div>
                        </th>
                        <td>
                            <div class="mt-2 mb-2" style="width: fit-content;">
                                <Input
                                    type="select"
                                    on:change={e => changeRoutingMode(e)}
                                >
                                    {#each [...routingModeOptions] as option}
                                        <option value={option.id} selected={option.id === agent.mode}>
                                            {option.name}
                                        </option>
                                    {/each}
                                </Input>
                            </div>
                        </td>
                    </tr>
                    {/if}
                    <tr>
                        <th class="agent-prop-key">
                            <div class="mt-2 mb-2">
                                Visibility
                            </div>
                        </th>
                        <td>
                            <div class="form-check mt-2 mb-2" style="width: fit-content;">
                                <input 
                                    class="form-check-input" 
                                    type="checkbox" 
                                    bind:checked={agent.is_public} 
                                    on:change={handleAgentChange}
                                    id="is_public" 
                                />
                                <label class="form-check-label" for="is_public">
                                    Public
                                </label>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th class="agent-prop-key">
                            <div class="mt-2 mb-2">
                                Routable
                            </div>
                        </th>
                        <td>
                            <div class="form-check mt-2 mb-2" style="width: fit-content;">
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
                        <th class="agent-prop-key">
                            <div class="mt-2 mb-2">
                                Profiles
                            </div>
                        </th>
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
                                            on:click={() => removeProfile(index)}
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
                                        on:click={() => addProfile()}
                                    />
                                </div>
                                {/if}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th class="agent-prop-key">
                            <div class="mt-2 mb-2">
                                Labels
                            </div>
                        </th>
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
                                            on:click={() => removeLabel(index)}
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
                                        on:click={() => addLabel()}
                                    />
                                </div>
                                {/if}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th class="agent-prop-key">
                            <div class="mt-2 mb-2">
                                Status
                            </div>
                        </th>
                        <td>							
                            <div class="form-check mt-2 mb-2" style="width: fit-content;">
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
                        <th class="agent-prop-key" style="vertical-align: middle">
                            <div class="mt-1">
                                Function visibility
                            </div>
                        </th>
                        <td>							
                            <div class="mt-2 mb-2">
                                <Select
                                    tag={'function-visibility-mode-select'}
                                    containerStyles={'width: 50%; min-width: 100px;'}
                                    placeholder={'Select'}
                                    selectedValues={agent.function_visibility_mode ? [agent.function_visibility_mode] : []}
                                    options={functionVisibilityModeOptions}
                                    on:select={e => changeFunctionVisibilityMode(e)}
                                />
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th class="agent-prop-key" style="vertical-align: middle">
                            <div class="mt-1">
                                Max messages
                            </div>
                        </th>
                        <td>							
                            <div class="mt-2 mb-2">
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
                        <th class="agent-prop-key">
                            <div class="mt-2 mb-2">
                                Created Date
                            </div>
                        </th>
                        <td>
                            <div class="mt-2 mb-2">
                                {utcToLocal(agent.created_datetime)}
                            </div>
                        </td>
                    </tr>
                </tbody>
            </Table>
        </div>
    </CardBody>
</Card>
