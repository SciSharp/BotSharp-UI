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

    /** @type {import('$commonTypes').LabelValuePair[]} */
    const routingModeOptions = Object.entries(RoutingMode).map(([_, v]) => (
        { label: v, value: v }
    ));

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
        // Select fires `{ detail: { selecteds: [{ label, value }] } }`.
        const selectedValues = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value) || [];
        agent.mode = selectedValues.length > 0 ? selectedValues[0] : null;
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

<div class="ao-card">
    <div class="ao-card-header">
        <div class="ao-header-block">
            <div class="ao-avatar-row">
                <img
                    src="images/users/bot.png"
                    alt=""
                    width="50"
                    height="50"
                    class="ao-avatar-img"
                />
                {#if !!AgentExtensions.chatable(agent)}
                    <button
                        type="button"
                        class="ao-chat-btn"
                        title="Chat with me"
                        aria-label="Chat with me"
                        onclick={() => chatWithAgent()}
                    >
                        <span class="ao-chat-btn-label">{'Chat with me'}</span>
                        <i class="mdi mdi-chat"></i>
                    </button>
                {/if}
            </div>
            <h5 class="ao-name">
                <InPlaceEdit bind:value={agent.name} onInput={handleAgentChange} />
            </h5>
            <p class="ao-updated">{`Updated at ${utcToLocal(agent.updated_datetime)}`}</p>
        </div>
    </div>
    <div class="ao-card-body">
        <div class="ao-table-wrap">
            <table class="ao-table">
                <tbody>
                    <tr>
                        <th class="ao-key">Type</th>
                        <td class="ao-val">
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
                        <th class="ao-key">
                            Routing Mode
                        </th>
                        <td class="ao-val">
                            <Select
                                tag={'agent-routing-mode-select'}
                                containerStyles={'width: 50%; min-width: 100px;'}
                                placeholder={'Select'}
                                selectedValues={agent.mode ? [agent.mode] : []}
                                options={routingModeOptions}
                                onselect={e => changeRoutingMode(e)}
                            />
                        </td>
                    </tr>
                    {/if}
                    <tr>
                        <th class="ao-key">Visibility</th>
                        <td class="ao-val">
                            <label class="ao-check">
                                <input
                                    class="ao-checkbox"
                                    type="checkbox"
                                    bind:checked={agent.is_public}
                                    onchange={handleAgentChange}
                                    id="is_public"
                                />
                                <span>Public</span>
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th class="ao-key">Routable</th>
                        <td class="ao-val">
                            <label class="ao-check">
                                <input
                                    class="ao-checkbox"
                                    type="checkbox"
                                    bind:checked={agent.allow_routing}
                                    onchange={handleAgentChange}
                                    id="allow_routing"
                                />
                                <span>Allow</span>
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th class="ao-key">Profiles</th>
                        <td class="ao-val">
                            <div class="ao-list">
                                {#each profiles as _, index}
                                <div class="ao-list-row">
                                    <input
                                        class="ao-input"
                                        type="text"
                                        placeholder="Typing here..."
                                        maxlength={30}
                                        bind:value={profiles[index]}
                                        oninput={handleAgentChange}
                                    />
                                    <span class="ao-list-remove">
                                        <i
                                            class="bx bxs-no-entry"
                                            role="link"
                                            tabindex="0"
                                            onkeydown={() => {}}
                                            onclick={() => removeProfile(index)}
                                        ></i>
                                    </span>
                                </div>
                                {/each}
                                {#if profiles?.length < limit}
                                <div class="ao-list-add">
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
                        <th class="ao-key">Labels</th>
                        <td class="ao-val">
                            <div class="ao-list">
                                {#each labels as _, index}
                                <div class="ao-list-row">
                                    <input
                                        class="ao-input"
                                        type="text"
                                        placeholder="Typing here..."
                                        maxlength={30}
                                        bind:value={labels[index]}
                                        oninput={handleAgentChange}
                                    />
                                    <span class="ao-list-remove">
                                        <i
                                            class="bx bxs-no-entry"
                                            role="link"
                                            tabindex="0"
                                            onkeydown={() => {}}
                                            onclick={() => removeLabel(index)}
                                        ></i>
                                    </span>
                                </div>
                                {/each}
                                {#if labels?.length < limit}
                                <div class="ao-list-add">
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
                        <th class="ao-key">Status</th>
                        <td class="ao-val">
                            <label class="ao-check">
                                <input
                                    class="ao-checkbox"
                                    type="checkbox"
                                    bind:checked={agent.disabled}
                                    onchange={handleAgentChange}
                                    id="disabled"
                                />
                                <span>Disabled</span>
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th class="ao-key">Function visibility</th>
                        <td class="ao-val">
                            <Select
                                tag={'function-visibility-mode-select'}
                                containerStyles={'width: 50%; min-width: 100px;'}
                                placeholder={'Select'}
                                selectedValues={agent.function_visibility_mode ? [agent.function_visibility_mode] : []}
                                options={functionVisibilityModeOptions}
                                onselect={e => changeFunctionVisibilityMode(e)}
                            />
                        </td>
                    </tr>
                    <tr>
                        <th class="ao-key">Max messages</th>
                        <td class="ao-val">
                            <input
                                type="number"
                                class="ao-input ao-input-number"
                                min={1}
                                max={1000}
                                step={1}
                                bind:value={agent.max_message_count}
                                oninput={handleAgentChange}
                            />
                        </td>
                    </tr>
                    <tr>
                        <th class="ao-key">Created Date</th>
                        <td class="ao-val">
                            {utcToLocal(agent.created_datetime)}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>


