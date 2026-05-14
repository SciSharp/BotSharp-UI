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
                        onclick={() => chatWithAgent()}
                    >
                        <span>{'Chat with me'}</span>
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
                            <div class="ao-fit-control">
                                <select
                                    class="ao-select"
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

<style>
    /* ===== Card shell ===== */
    .ao-card {
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.625rem;
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.04),
            0 6px 16px -10px rgb(15 23 42 / 0.08);
    }
    .ao-card-header {
        padding: 1rem 1.25rem;
        border-bottom: 1px solid rgb(229 231 235);
        background-color: color-mix(in srgb, var(--color-primary) 4%, transparent);
    }
    .ao-card-body {
        padding: 1rem 1.25rem;
    }

    /* ===== Header (avatar + name + updated) ===== */
    .ao-header-block {
        text-align: center;
    }
    .ao-avatar-row {
        display: flex;
        justify-content: center;
        position: relative;
    }
    .ao-avatar-img {
        width: 50px;
        height: 50px;
        display: block;
        margin: 0 auto;
        border-radius: 50%;
        object-fit: cover;
    }
    .ao-chat-btn {
        position: absolute;
        top: 20%;
        left: calc(50% + 30px);
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        height: 1.875rem;
        padding: 0 0.625rem;
        background-color: color-mix(in srgb, var(--color-info) 14%, transparent);
        color: var(--color-info);
        border: 1px solid transparent;
        border-radius: 0.375rem;
        font-size: 0.75rem;
        font-weight: 500;
        line-height: 1;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
    }
    .ao-chat-btn:hover {
        background-color: var(--color-info);
        color: rgb(255 255 255);
    }
    .ao-chat-btn i {
        font-size: 0.875rem;
        line-height: 1;
    }
    .ao-name {
        margin: 0.25rem 0;
        display: flex;
        justify-content: center;
        font-size: 1rem;
        font-weight: 600;
        color: rgb(55 65 81);
    }
    .ao-updated {
        margin: 0;
        font-size: 0.75rem;
        color: var(--color-muted);
    }

    /* ===== Properties table ===== */
    .ao-table-wrap {
        width: 100%;
    }
    .ao-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8125rem;
    }
    .ao-table tr {
        border-top: 1px solid rgb(243 244 246);
    }
    .ao-table tr:first-child {
        border-top: 0;
    }
    .ao-key {
        width: 45%;
        padding: 0.625rem 0.5rem 0.625rem 0;
        font-weight: 600;
        color: rgb(55 65 81);
        text-align: left;
        vertical-align: middle;
    }
    .ao-val {
        padding: 0.625rem 0;
        color: rgb(55 65 81);
        vertical-align: middle;
    }
    .ao-fit-control {
        width: fit-content;
    }

    /* ===== Inputs / Select ===== */
    .ao-input {
        height: 2rem;
        width: 100%;
        padding: 0 0.5rem;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.375rem;
        background-color: rgb(249 250 251);
        font-size: 0.8125rem;
        color: rgb(17 24 39);
        font-family: inherit;
        transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
    }
    .ao-input::placeholder {
        color: var(--color-muted);
    }
    .ao-input:focus {
        outline: 0;
        border-color: var(--color-primary);
        background-color: rgb(255 255 255);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }
    .ao-input-number {
        width: 50%;
        min-width: 100px;
        text-align: center;
    }
    .ao-select {
        height: 2rem;
        padding: 0 1.75rem 0 0.5rem;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.375rem;
        background-color: rgb(249 250 251);
        font-size: 0.8125rem;
        color: rgb(17 24 39);
        appearance: none;
        background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2374788d'%3E%3Cpath d='M5.5 7.5l4.5 4.5 4.5-4.5z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.25rem center;
        background-size: 1.25rem;
        cursor: pointer;
    }
    .ao-select:focus {
        outline: 0;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }

    /* ===== Checkbox ===== */
    .ao-check {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        cursor: pointer;
        font-size: 0.8125rem;
        color: rgb(55 65 81);
        width: fit-content;
    }
    .ao-checkbox {
        appearance: none;
        -webkit-appearance: none;
        width: 1rem;
        height: 1rem;
        border: 1px solid rgb(209 213 219);
        border-radius: 0.25rem;
        background-color: rgb(255 255 255);
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .ao-checkbox:hover {
        border-color: var(--color-primary);
    }
    .ao-checkbox:focus-visible {
        outline: 0;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }
    .ao-checkbox:checked {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23fff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' d='M3.5 8.5l3 3 6-6.5'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: center;
        background-size: 0.875rem;
    }

    /* ===== List (profiles / labels) ===== */
    .ao-list {
        width: 95%;
        max-width: 100%;
        max-height: 200px;
        overflow-y: auto;
        scrollbar-width: none;
    }
    .ao-list-row {
        display: flex;
        align-items: center;
        gap: 0.3125rem;
        margin-bottom: 0.3125rem;
    }
    .ao-list-row .ao-input {
        flex: 1 1 auto;
        border: 1px solid rgb(229 231 235);
    }
    .ao-list-remove {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .ao-list-remove i {
        cursor: pointer;
        color: var(--color-danger);
        font-size: 1.125rem;
        line-height: 1;
        transition: filter 0.15s ease;
    }
    .ao-list-remove i:hover {
        filter: brightness(0.9);
    }
    .ao-list-add {
        font-size: 1.25rem;
        color: var(--color-primary);
        display: inline-flex;
        align-items: center;
    }
    .ao-list-add i {
        cursor: pointer;
        transition: color 0.15s ease, transform 0.15s ease;
    }
    .ao-list-add i:hover {
        color: var(--color-primary-hover);
        transform: scale(1.1);
    }

    /* ===== Dark mode ===== */
    :global(.dark) .ao-card {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .ao-card-header {
        border-bottom-color: rgb(55 65 81);
    }
    :global(.dark) .ao-name,
    :global(.dark) .ao-key,
    :global(.dark) .ao-val,
    :global(.dark) .ao-check {
        color: rgb(229 231 235);
    }
    :global(.dark) .ao-table tr {
        border-top-color: rgb(55 65 81);
    }
    :global(.dark) .ao-input,
    :global(.dark) .ao-select {
        background-color: rgb(17 24 39);
        border-color: rgb(55 65 81);
        color: rgb(229 231 235);
    }
    :global(.dark) .ao-checkbox {
        background-color: rgb(17 24 39);
        border-color: rgb(75 85 99);
    }
</style>
