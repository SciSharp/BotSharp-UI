<script>
    import { slide } from 'svelte/transition';
    import { LlmModelCapability, LlmModelType, ReasoningEffortLevel } from '$lib/helpers/enums';

    /**
     * @type {{
     *   title?: string,
     *   llmConfig?: any,
     *   llmConfigOptions?: import('$commonTypes').LlmConfig[],
     *   handleAgentChange?: () => void
     * }}
     */
    let {
        title = 'Realtime',
        llmConfig,
        llmConfigOptions = [],
        handleAgentChange = () => {}
    } = $props();

    export function fetchConfig() {
        if (!config.provider && !config.model) {
            return null;
        }

        const reasoningEffort = models.find(x => x.name === config.model)?.reasoning != null ? config.reasoning_effort_level : null;
        return {
            ...config,
            provider: config.provider || null,
            model: config.model || null,
            reasoning_effort_level: reasoningEffort
        };
    }

    /** @type {import('$commonTypes').LabelValuePair[]} */
    const defaultReasonLevelOptions = [
        { value: '', label: '' },
        ...Object.entries(ReasoningEffortLevel).map(([k, v]) => ({
            value: v,
            label: v
        }))
    ];

    /** @type {boolean} */
    let collapsed = $state(true);

    /** @type {import('$commonTypes').LlmConfig[]} */
    let innerLlmConfigOptions = $state([]);

    /** @type {string[]} */
    let providers = $state([]);

    /** @type {import('$commonTypes').LlmModelSetting[]} */
    let models = $state([]);

    /** @type {import('$commonTypes').LabelValuePair[]} */
    let reasoningLevelOptions = $state(defaultReasonLevelOptions);

    // svelte-ignore state_referenced_locally
    let config = $state(llmConfig || {});

    let isReasoningModel = $derived(models.find(x => x.name === config.model)?.reasoning != null);

    $effect(() => {
        if (llmConfigOptions.length > 0 && innerLlmConfigOptions.length === 0) {
            innerLlmConfigOptions = llmConfigOptions;
            const innerProviders = innerLlmConfigOptions.filter(x => x.models?.some(y => y.type === LlmModelType.Realtime || y.capabilities?.includes(LlmModelCapability.Realtime)));
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
        return innerLlmConfigOptions.find(x => x.provider === provider)?.models
                                   ?.filter(x => x.type === LlmModelType.Realtime || x.capabilities?.includes(LlmModelCapability.Realtime)) || [];
    }

    /** @param {any} e */
    async function changeProvider(e) {
        const provider = e.target.value;
        config.provider = provider || null;

        if (!provider) {
            models = [];
            config.model = null;
            config.reasoning_effort_level = null;
            handleAgentChange();
            return;
        }

        models = getLlmModels(provider);
        config.model = models[0]?.name;
        config.reasoning_effort_level = null;
        onModelChanged(config);
        handleAgentChange();
    }

    /** @param {any} e */
    function changeModel(e) {
        config.model = e.target.value || null;
        onModelChanged(config);
        config.reasoning_effort_level = null;
        handleAgentChange();
    }

    /** @param {any} e */
    function changeReasoningEffortLevel(e) {
        config.reasoning_effort_level = e.target.value || null;
        handleAgentChange();
    }

    /** @param {any} config */
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


<div class="agent-config-container">
    <div
        class="config-header text-center"
        role="button"
        tabindex="0"
        onclick={() => collapsed = !collapsed}
        onkeydown={(e) => e.key === 'Enter' && (collapsed = !collapsed)}
    >
        <h6 class="mt-1 mb-3 d-flex align-items-center justify-content-center gap-2">
            <i class="mdi {collapsed ? 'mdi-chevron-right' : 'mdi-chevron-down'}"></i>
            {title}
        </h6>
    </div>

    {#if !collapsed}
    <div transition:slide={{ duration: 200 }}>
        <div class="mb-3 row llm-config-item">
            <label for={`provider-${title}`} class="col-form-label llm-config-label">
                Provider
            </label>
            <div class="llm-config-input">
                <select class="form-select" id={`provider-${title}`} value={config.provider} onchange={e => changeProvider(e)}>
                    {#each providers as option}
                        <option value={option} selected={option == config.provider}>
                            {option}
                        </option>
                    {/each}
                </select>
            </div>
        </div>

        <div class="mb-3 row llm-config-item">
            <label for={`model-${title}`} class="col-form-label llm-config-label">
                Model
            </label>
            <div class="llm-config-input">
                <select class="form-select" id={`model-${title}`} value={config.model} disabled={models.length === 0} onchange={e => changeModel(e)}>
                    {#each models as option}
                        <option value={option.name} selected={option.name == config.model}>
                            {option.name}
                        </option>
                    {/each}
                </select>
            </div>
        </div>

        {#if isReasoningModel}
        <div class="mb-3 row llm-config-item">
            <label for={`reasoning-${title}`} class="col-form-label llm-config-label">
                Reasoning level
            </label>
            <div class="llm-config-input">
                <select class="form-select" id={`reasoning-${title}`} value={config.reasoning_effort_level} onchange={e => changeReasoningEffortLevel(e)}>
                    {#each reasoningLevelOptions as option}
                        <option value={option.value} selected={option.value == config.reasoning_effort_level}>
                            {option.label}
                        </option>
                    {/each}
                </select>
            </div>
        </div>
        {/if}
    </div>
    {/if}
</div>
