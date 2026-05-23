<script>
    import { slide } from 'svelte/transition';
    import Select from '$lib/common/dropdowns/Select.svelte';
    import { INTEGER_REGEX } from '$lib/helpers/constants';
    import { LlmModelCapability, LlmModelType, ReasoningEffortLevel } from '$lib/helpers/enums';

    /**
     * @type {{
     *   agent: import('$agentTypes').AgentModel,
     *   llmConfigs?: import('$commonTypes').LlmConfig[],
     *   handleAgentChange?: () => void
     * }}
     */
    let {
        agent,
        llmConfigs = [],
        handleAgentChange = () => {}
    } = $props();

    export function fetchConfig() {
        const reasoningEffort = models.find(x => x.name === config.model)?.reasoning != null ? config.reasoning_effort_level : null;
        return {
            ...config,
            provider: config.provider || null,
            model: config.model || null,
            max_output_tokens: Number(config.max_output_tokens) > 0 ? Number(config.max_output_tokens) : null,
            reasoning_effort_level: reasoningEffort
        };
    }

    const recursiveDepthLowerLimit = 1;

    /** @type {import('$commonTypes').LabelValuePair[]} */
    const defaultReasonLevelOptions = [
        { value: '', label: '' },
        ...Object.entries(ReasoningEffortLevel).map(([k, v]) => ({
            value: v,
            label: v
        }))
    ];

    /** @type {boolean} */
    let collapsed = $state(false);

    // svelte-ignore state_referenced_locally
    let config = $state(agent.llm_config || {});

    /** @type {import('$commonTypes').LlmConfig[]} */
    let innerLlmConfigs = $state([]);

    /** @type {string[]} */
    let providers = $state([]);

    /** @type {import('$commonTypes').LlmModelSetting[]} */
    let models = $state([]);

    /** @type {import('$commonTypes').LabelValuePair[]} */
    let reasoningLevelOptions = $state(defaultReasonLevelOptions);

    let isReasoningModel = $derived(models.find(x => x.name === config.model)?.reasoning != null);

    $effect(() => {
        if (llmConfigs.length > 0 && innerLlmConfigs.length === 0) {
            innerLlmConfigs = [...llmConfigs];
            const innerProviders = innerLlmConfigs.filter(x => x.models?.some(y => y.type === LlmModelType.Chat || y.capabilities?.includes(LlmModelCapability.Chat)));
            providers = ['', ...innerProviders.map(x => x.provider)];
            if (config.provider) {
                models = getLlmModels(config.provider);
            }
            const foundProvider = providers.find(x => x === config.provider);
            const foundModel = models.find(x => x.name === config.model);
            config.provider = foundProvider || null;
            config.model = foundModel?.name || null;
            onModelChanged(config);
        }
    });

    /** @param {string} provider */
    function getLlmModels(provider) {
        return innerLlmConfigs.find(x => x.provider === provider)?.models
                             ?.filter(x => x.type === LlmModelType.Chat || x.capabilities?.includes(LlmModelCapability.Chat)) || [];
    }

    /** @param {any} e */
    async function changeProvider(e) {
        const values = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value) || [];
        const provider = values[0] || '';
        config.provider = provider || null;

        if (!provider) {
            models = [];
            config.model = null;
            config.reasoning_effort_level = null;
            handleAgentChange();
            return;
        }

        config.is_inherit = false;
        models = getLlmModels(provider);
        config.model = models[0]?.name;
        config.reasoning_effort_level = null;
        onModelChanged(config);
        handleAgentChange();
    }

    /** @param {any} e */
    function changeModel(e) {
        const values = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value) || [];
        config.is_inherit = false;
        config.model = values[0] || null;
        onModelChanged(config);
        config.reasoning_effort_level = null;
        handleAgentChange();
    }

    /** @param {any} e */
    function changeMaxRecursiveDepth(e) {
        let value = Number(e.target.value) || 0;

        if (value < recursiveDepthLowerLimit) {
            value = recursiveDepthLowerLimit;
        }

        config.max_recursion_depth = value;
        handleAgentChange();
    }

    /** @param {any} e */
    function changeMaxOutputToken(e) {
        const value = Number(e.target.value) || 0;
        config.max_output_tokens = value;
        handleAgentChange();
    }

    /** @param {any} e */
    function changeReasoningEffortLevel(e) {
        const values = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value) || [];
        config.reasoning_effort_level = values[0] || null;
        handleAgentChange();
    }

    /** @param {any} e */
    function validateIntegerInput(e) {
        const reg = new RegExp(INTEGER_REGEX, 'g');
        if (e.key !== 'Backspace' && !reg.test(e.key)) {
            e.preventDefault();
        }
    }

    /** @param {import('$agentTypes').AgentLlmConfig | null} config */
    function onModelChanged(config) {
        reasoningLevelOptions = getReasoningLevelOptions(config?.model);
    }

    /** @param {string | null | undefined} model */
    function getReasoningLevelOptions(model) {
        let options = defaultReasonLevelOptions;
        const foundModel = models.find(x => x.name === model);
        if (foundModel?.reasoning == null) {
            return options;
        }

        const defaultOptions = foundModel?.reasoning?.parameters?.EffortLevel?.options;
        if (defaultOptions?.length > 0) {
            options = [
                { value: '', label: '' },
                // @ts-ignore
                ...defaultOptions.map(x => ({ value: x, label: x }))
            ];
        }

        return options;
    }
</script>

<div class="cc-card">
    <div
        class="cc-header"
        role="button"
        tabindex="0"
        onclick={() => collapsed = !collapsed}
        onkeydown={(e) => e.key === 'Enter' && (collapsed = !collapsed)}
    >
        <h6 class="cc-header-title">
            <i class="mdi {collapsed ? 'mdi-chevron-right' : 'mdi-chevron-down'}"></i>
            Chat
        </h6>
        {#if agent.llm_config?.is_inherit}
            <div class="cc-inherit-badge">
                <i class="bx bx-copy"></i> <span class="cc-muted">Inherited</span>
            </div>
        {/if}
    </div>

    {#if !collapsed}
    <div transition:slide={{ duration: 200 }} class="cc-body">
        <div class="cc-field">
            <label for="chat-provider" class="cc-label">
                Provider
            </label>
            <div class="cc-input-wrap">
                <Select
                    tag={'chat-provider'}
                    containerStyles={'width: 100%;'}
                    placeholder={'Select a provider'}
                    selectedValues={config.provider ? [config.provider] : []}
                    options={providers.filter(p => !!p).map(p => ({ label: p, value: p }))}
                    onselect={e => changeProvider(e)}
                />
            </div>
        </div>

        <div class="cc-field">
            <label for="chat-model" class="cc-label">
                Model
            </label>
            <div class="cc-input-wrap">
                <Select
                    tag={'chat-model'}
                    containerStyles={'width: 100%;'}
                    placeholder={'Select a model'}
                    disabled={models.length === 0}
                    selectedValues={config.model ? [config.model] : []}
                    options={models.map(m => ({ label: m.name, value: m.name }))}
                    onselect={e => changeModel(e)}
                />
            </div>
        </div>

        <div class="cc-field">
            <label for="chat-max-recursive-depth" class="cc-label">
                Max recursive depth
            </label>
            <div class="cc-input-wrap">
                <input
                    class="cc-input cc-input-number"
                    id="chat-max-recursive-depth"
                    type="number"
                    min={recursiveDepthLowerLimit}
                    value={config.max_recursion_depth}
                    onkeydown={e => validateIntegerInput(e)}
                    onchange={e => changeMaxRecursiveDepth(e)}
                />
            </div>
        </div>

        <div class="cc-field">
            <label for="chat-max-output-tokens" class="cc-label">
                Max output tokens
            </label>
            <div class="cc-input-wrap">
                <input
                    class="cc-input cc-input-number"
                    id="chat-max-output-tokens"
                    type="number"
                    value={config.max_output_tokens}
                    onkeydown={e => validateIntegerInput(e)}
                    onchange={e => changeMaxOutputToken(e)}
                />
            </div>
        </div>

        {#if isReasoningModel}
        <div class="cc-field">
            <label for="chat-reasoning-effort" class="cc-label">
                Reasoning level
            </label>
            <div class="cc-input-wrap">
                <Select
                    tag={'chat-reasoning-effort'}
                    containerStyles={'width: 100%;'}
                    placeholder={'Select a level'}
                    selectedValues={config.reasoning_effort_level ? [config.reasoning_effort_level] : []}
                    options={reasoningLevelOptions.filter(o => !!o.value)}
                    onselect={e => changeReasoningEffortLevel(e)}
                />
            </div>
        </div>
        {/if}
    </div>
    {/if}
</div>


