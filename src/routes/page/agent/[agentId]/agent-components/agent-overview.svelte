<script>
    import InPlaceEdit from '$lib/common/shared/InPlaceEdit.svelte';
    import Select from '$lib/common/dropdowns/Select.svelte';
    import { utcToLocal } from '$lib/helpers/datetime';
	import { RoutingMode, AgentType, FunctionVisMode } from '$lib/helpers/enums';
	import { AgentExtensions } from '$lib/helpers/utils/agent';
	import { openAppRoute } from '$lib/helpers/utils/desktop';

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

    /** Shared utility strings — kept in one place so every row stays visually identical. */
    const rowClass = 'grid grid-cols-1 gap-x-4 gap-y-1.5 px-4 py-3 sm:grid-cols-[38%_minmax(0,1fr)] sm:items-center';
    const keyClass = 'text-[0.7rem] font-semibold uppercase tracking-wider text-muted';
    const valueClass = 'min-w-0 text-sm text-dark dark:text-gray-100';
    const inputClass = 'h-8 w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-0 text-sm text-gray-900 placeholder:text-muted focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:bg-gray-900';
    const checkClass = 'inline-flex w-fit cursor-pointer items-center gap-2 text-sm text-dark dark:text-gray-100';
    const checkboxClass = 'h-4 w-4 rounded border-gray-300 bg-white text-primary focus:ring-2 focus:ring-primary/25 focus:ring-offset-0 dark:border-gray-600 dark:bg-gray-900';
    const iconBtnClass = 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-danger';
    const addBtnClass = 'mt-2 inline-flex items-center gap-1 rounded-md border border-dashed border-gray-300 px-2 py-1 text-xs font-medium text-primary transition-colors hover:border-primary hover:bg-primary/5 dark:border-gray-600 dark:hover:border-primary';

    /** @type {import('$commonTypes').LabelValuePair[]} */
    const routingModeOptions = Object.entries(RoutingMode).map(([_, v]) => (
        { label: v, value: v }
    ));

    const functionVisibilityModeOptions = Object.entries(FunctionVisMode).map(([_, v]) => (
		{ label: v, value: v }
	));

    const agentTypeLabels = {
        [AgentType.Routing]: 'Routing Agent',
        [AgentType.Planning]: 'Planning Agent',
        [AgentType.Evaluating]: 'Evaluation Agent',
        [AgentType.Static]: 'Static Agent',
        [AgentType.Task]: 'Task Agent'
    };

    let agentTypeLabel = $derived(agentTypeLabels[agent?.type] ?? 'Unknown');

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

        // Not window.open: that is a silent no-op in the Tauri shell, which has no tabs. See
        // openAppRoute — a new tab in the browser, same-window navigation on the desktop.
        openAppRoute(`/chat/${agent?.id}`);
    }
</script>

<div class="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
    <!-- Header: identity on one horizontal band, so the properties below start higher up. -->
    <div class="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
        <img
            src="images/users/bot.png"
            alt=""
            width="44"
            height="44"
            class="h-11 w-11 shrink-0 rounded-full object-cover"
        />
        <div class="min-w-0 flex-1">
            <!-- -ml-2 cancels the editable pill's own left padding so the name's glyphs
                 line up with the timestamp underneath it. -->
            <h5 class="m-0 -ml-2 flex min-w-0 text-sm font-semibold text-dark dark:text-gray-100">
                <InPlaceEdit bind:value={agent.name} align={'start'} onInput={handleAgentChange} />
            </h5>
            <p class="m-0 mt-0.5 truncate text-xs text-muted">
                {`Updated at ${utcToLocal(agent.updated_datetime)}`}
            </p>
        </div>
        {#if !!AgentExtensions.chatable(agent)}
            <button
                type="button"
                class="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-info px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-info/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
                title="Chat with me"
                onclick={() => chatWithAgent()}
            >
                <i class="mdi mdi-chat text-sm leading-none"></i>
                <span class="hidden md:inline">{'Chat with me'}</span>
            </button>
        {/if}
    </div>

    <!-- Properties: one flat key/value row each, separated by hairlines instead of boxes. -->
    <dl class="m-0 divide-y divide-gray-100 dark:divide-gray-700/60">
        <div class={rowClass}>
            <dt class={keyClass}>Type</dt>
            <dd class="{valueClass} m-0">
                <span class="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {agentTypeLabel}
                </span>
            </dd>
        </div>

        {#if agent.is_router}
        <div class={rowClass}>
            <dt class={keyClass}>Routing Mode</dt>
            <dd class="{valueClass} m-0">
                <Select
                    tag={'agent-routing-mode-select'}
                    containerClasses={'w-full max-w-56 min-w-25'}
                    placeholder={'Select'}
                    selectedValues={agent.mode ? [agent.mode] : []}
                    options={routingModeOptions}
                    onselect={e => changeRoutingMode(e)}
                />
            </dd>
        </div>
        {/if}

        <div class={rowClass}>
            <dt class={keyClass}>Visibility</dt>
            <dd class="{valueClass} m-0">
                <label class={checkClass}>
                    <input
                        class={checkboxClass}
                        type="checkbox"
                        bind:checked={agent.is_public}
                        onchange={handleAgentChange}
                        id="is_public"
                    />
                    <span>Public</span>
                </label>
            </dd>
        </div>

        <div class={rowClass}>
            <dt class={keyClass}>Routable</dt>
            <dd class="{valueClass} m-0">
                <label class={checkClass}>
                    <input
                        class={checkboxClass}
                        type="checkbox"
                        bind:checked={agent.allow_routing}
                        onchange={handleAgentChange}
                        id="allow_routing"
                    />
                    <span>Allow</span>
                </label>
            </dd>
        </div>

        <div class={rowClass}>
            <dt class={keyClass}>Profiles</dt>
            <dd class="{valueClass} m-0">
                {#if profiles?.length > 0}
                <div class="max-h-50 space-y-1.5 overflow-y-auto pr-1 scrollbar-on-hover">
                    {#each profiles as _, index}
                    <div class="flex items-center gap-1.5">
                        <input
                            class={inputClass}
                            type="text"
                            placeholder="Typing here..."
                            maxlength={30}
                            aria-label={`Profile ${index + 1}`}
                            bind:value={profiles[index]}
                            oninput={handleAgentChange}
                        />
                        <button
                            type="button"
                            class={iconBtnClass}
                            title="Remove profile"
                            aria-label={`Remove profile ${index + 1}`}
                            onclick={() => removeProfile(index)}
                        >
                            <i class="mdi mdi-close text-base leading-none"></i>
                        </button>
                    </div>
                    {/each}
                </div>
                {/if}
                {#if profiles?.length < limit}
                <button
                    type="button"
                    class="{addBtnClass} {profiles?.length > 0 ? '' : 'mt-0'}"
                    onclick={() => addProfile()}
                >
                    <i class="mdi mdi-plus text-sm leading-none"></i>
                    <span>Add profile</span>
                </button>
                {/if}
            </dd>
        </div>

        <div class={rowClass}>
            <dt class={keyClass}>Labels</dt>
            <dd class="{valueClass} m-0">
                {#if labels?.length > 0}
                <div class="max-h-50 space-y-1.5 overflow-y-auto pr-1 scrollbar-on-hover">
                    {#each labels as _, index}
                    <div class="flex items-center gap-1.5">
                        <input
                            class={inputClass}
                            type="text"
                            placeholder="Typing here..."
                            maxlength={30}
                            aria-label={`Label ${index + 1}`}
                            bind:value={labels[index]}
                            oninput={handleAgentChange}
                        />
                        <button
                            type="button"
                            class={iconBtnClass}
                            title="Remove label"
                            aria-label={`Remove label ${index + 1}`}
                            onclick={() => removeLabel(index)}
                        >
                            <i class="mdi mdi-close text-base leading-none"></i>
                        </button>
                    </div>
                    {/each}
                </div>
                {/if}
                {#if labels?.length < limit}
                <button
                    type="button"
                    class="{addBtnClass} {labels?.length > 0 ? '' : 'mt-0'}"
                    onclick={() => addLabel()}
                >
                    <i class="mdi mdi-plus text-sm leading-none"></i>
                    <span>Add label</span>
                </button>
                {/if}
            </dd>
        </div>

        <div class={rowClass}>
            <dt class={keyClass}>Status</dt>
            <dd class="{valueClass} m-0">
                <label class={checkClass}>
                    <input
                        class={checkboxClass}
                        type="checkbox"
                        bind:checked={agent.disabled}
                        onchange={handleAgentChange}
                        id="disabled"
                    />
                    <span>Disabled</span>
                </label>
            </dd>
        </div>

        <div class={rowClass}>
            <dt class={keyClass}>Function visibility</dt>
            <dd class="{valueClass} m-0">
                <Select
                    tag={'function-visibility-mode-select'}
                    containerClasses={'w-full max-w-56 min-w-25'}
                    placeholder={'Select'}
                    selectedValues={agent.function_visibility_mode ? [agent.function_visibility_mode] : []}
                    options={functionVisibilityModeOptions}
                    onselect={e => changeFunctionVisibilityMode(e)}
                />
            </dd>
        </div>

        <div class={rowClass}>
            <dt class={keyClass}>Max messages</dt>
            <dd class="{valueClass} m-0">
                <input
                    type="number"
                    class="{inputClass} max-w-28 text-center"
                    min={1}
                    max={1000}
                    step={1}
                    aria-label="Max messages"
                    bind:value={agent.max_message_count}
                    oninput={handleAgentChange}
                />
            </dd>
        </div>

        <div class={rowClass}>
            <dt class={keyClass}>Created Date</dt>
            <dd class="{valueClass} m-0">{utcToLocal(agent.created_datetime)}</dd>
        </div>
    </dl>
</div>
