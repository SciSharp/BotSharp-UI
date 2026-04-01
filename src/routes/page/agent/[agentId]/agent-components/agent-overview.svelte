<script>
    import InPlaceEdit from '$lib/common/shared/InPlaceEdit.svelte';
    import Select from '$lib/common/dropdowns/Select.svelte';
    import { utcToLocal } from '$lib/helpers/datetime';
	import { RoutingMode, AgentType, FunctionVisMode } from '$lib/helpers/enums';
	import { AgentExtensions } from '$lib/helpers/utils/agent';

    const limit = 10;

    /**
     * @type {{
     *   agent: import('$agentTypes').AgentModel,
     *   profiles?: string[],
     *   labels?: string[],
     *   handleAgentChange?: () => void
     * }}
     */
    let {
        agent = $bindable(),
        profiles = $bindable([]),
        labels = $bindable([]),
        handleAgentChange = () => {}
    } = $props();

    /** @type {import('$commonTypes').IdName[]} */
	let routingModeOptions = [
        { id: null, name: '' },
        ...Object.entries(RoutingMode).map(([_, v]) => ({ id: v, name: v }))
    ];

    const functionVisibilityModeOptions = Object.entries(FunctionVisMode).map(([_, v]) => (
		{ label: v, value: v }
	));

    function addProfile() {
        if (!agent) return;

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
        if (!agent) return;

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
        if (!agent?.id) return;

        window.open(`/chat/${agent?.id}`, '_blank');
    }
</script>

<div class="card">
    <div class="card-header">
        <div class="text-center">
            <div class="agent-overview-header">
                <img
                    src="images/users/bot.png"
                    alt=""
                    width="50"
                    height="50"
                    style="width: 50px; height: 50px;"
                    class="mx-auto d-block"
                />
                {#if !!AgentExtensions.chatable(agent)}
                    <button
                        type="button"
                        class="btn btn-sm btn-soft-info agent-chat"
                        onclick={() => chatWithAgent()}
                    >
                        <span>{'Chat with me'}</span>
                        <span><i class="mdi mdi-chat"></i></span>
                    </button>
                {/if}
            </div>
            <h5 class="mt-1 mb-1 div-center">
                <InPlaceEdit bind:value={agent.name} onInput={handleAgentChange} />
            </h5>
            <p class="text-muted mb-0">{`Updated at ${utcToLocal(agent.updated_datetime)}`}</p>
        </div>
    </div>
    <div class="card-body">
        <div class="table-responsive">
            <table class="table">
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
                                <select
                                    class="form-select"
                                    onchange={e => changeRoutingMode(e)}
                                >
                                    {#each [...routingModeOptions] as option}
                                        <option value={option.id} selected={option.id === agent.mode}>
                                            {option.name}
                                        </option>
                                    {/each}
                                </select>
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
                                    onchange={handleAgentChange}
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
                                    onchange={handleAgentChange}
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
                                {#each profiles as _, index}
                                <div class="edit-wrapper">
                                    <input
                                        class="form-control edit-text-box"
                                        type="text"
                                        placeholder="Typing here..."
                                        maxlength={30}
                                        bind:value={profiles[index]}
                                        oninput={handleAgentChange}
                                    />
                                    <div class="delete-icon">
                                        <i
                                            class="bx bxs-no-entry"
                                            role="link"
                                            tabindex="0"
                                            onkeydown={() => {}}
                                            onclick={() => removeProfile(index)}
                                        ></i>
                                    </div>
                                </div>
                                {/each}
                                {#if profiles?.length < limit}
                                <div class="list-add">
                                    <i
                                        class="bx bx bx-list-plus"
                                        role="link"
                                        tabindex="0"
                                        onkeydown={() => {}}
                                        onclick={() => addProfile()}
                                    ></i>
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
                                {#each labels as _, index}
                                <div class="edit-wrapper">
                                    <input
                                        class="form-control edit-text-box"
                                        type="text"
                                        placeholder="Typing here..."
                                        maxlength={30}
                                        bind:value={labels[index]}
                                        oninput={handleAgentChange}
                                    />
                                    <div class="delete-icon">
                                        <i
                                            class="bx bxs-no-entry"
                                            role="link"
                                            tabindex="0"
                                            onkeydown={() => {}}
                                            onclick={() => removeLabel(index)}
                                        ></i>
                                    </div>
                                </div>
                                {/each}
                                {#if labels?.length < limit}
                                <div class="list-add">
                                    <i
                                        class="bx bx bx-list-plus"
                                        role="link"
                                        tabindex="0"
                                        onkeydown={() => {}}
                                        onclick={() => addLabel()}
                                    ></i>
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
                                    onchange={handleAgentChange}
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
                                    onselect={e => changeFunctionVisibilityMode(e)}
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
                                <input
                                    type="number"
                                    style="width: 50%; min-width: 100px;"
                                    class="form-control text-center"
                                    min={1}
                                    max={1000}
                                    step={1}
                                    bind:value={agent.max_message_count}
                                    oninput={handleAgentChange}
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
            </table>
        </div>
    </div>
</div>
