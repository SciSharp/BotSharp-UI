<script>
    import { slide } from 'svelte/transition';
    import Select from '$lib/common/dropdowns/Select.svelte';
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

        models = getLlmModels(provider);
        config.model = models[0]?.name;
        config.reasoning_effort_level = null;
        onModelChanged(config);
        handleAgentChange();
    }

    /** @param {any} e */
    function changeModel(e) {
        const values = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value) || [];
        config.model = values[0] || null;
        onModelChanged(config);
        config.reasoning_effort_level = null;
        handleAgentChange();
    }

    /** @param {any} e */
    function changeReasoningEffortLevel(e) {
        const values = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value) || [];
        config.reasoning_effort_level = values[0] || null;
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


<div class="rc-card">
    <div
        class="rc-header"
        role="button"
        tabindex="0"
        onclick={() => collapsed = !collapsed}
        onkeydown={(e) => e.key === 'Enter' && (collapsed = !collapsed)}
    >
        <h6 class="rc-header-title">
            <i class="mdi {collapsed ? 'mdi-chevron-right' : 'mdi-chevron-down'}"></i>
            {title}
        </h6>
    </div>

    {#if !collapsed}
    <div transition:slide={{ duration: 200 }} class="rc-body">
        <div class="rc-field">
            <label for={`provider-${title}`} class="rc-label">
                Provider
            </label>
            <div class="rc-input-wrap">
                <Select
                    tag={`provider-${title}`}
                    containerStyles={'width: 100%;'}
                    placeholder={'Select a provider'}
                    selectedValues={config.provider ? [config.provider] : []}
                    options={providers.filter(p => !!p).map(p => ({ label: p, value: p }))}
                    onselect={e => changeProvider(e)}
                />
            </div>
        </div>

        <div class="rc-field">
            <label for={`model-${title}`} class="rc-label">
                Model
            </label>
            <div class="rc-input-wrap">
                <Select
                    tag={`model-${title}`}
                    containerStyles={'width: 100%;'}
                    placeholder={'Select a model'}
                    disabled={models.length === 0}
                    selectedValues={config.model ? [config.model] : []}
                    options={models.map(m => ({ label: m.name, value: m.name }))}
                    onselect={e => changeModel(e)}
                />
            </div>
        </div>

        {#if isReasoningModel}
        <div class="rc-field">
            <label for={`reasoning-${title}`} class="rc-label">
                Reasoning level
            </label>
            <div class="rc-input-wrap">
                <Select
                    tag={`reasoning-${title}`}
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
