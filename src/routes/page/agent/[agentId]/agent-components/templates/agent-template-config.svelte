<script>
    import { onMount } from 'svelte';
    import { untrack } from 'svelte';
    import { INTEGER_REGEX } from '$lib/helpers/constants';
    import { LlmModelCapability, LlmModelType, ReasoningEffortLevel, ResponseFormat } from '$lib/helpers/enums';
    import { getLlmConfigs } from '$lib/services/llm-provider-service';
    import Select from '$lib/common/dropdowns/Select.svelte';

    /**
     * @type {{
     *   template: import('$agentTypes').AgentTemplate,
     *   handleAgentChange?: () => void
     * }}
     */
    let {
        template = $bindable(),
        handleAgentChange = () => {}
    } = $props();

    /** @type {import('$commonTypes').LabelValuePair[]} */
    const defaultReasonLevelOptions = [
        { value: '', label: '' },
        ...Object.entries(ReasoningEffortLevel).map(([k, v]) => ({
            value: v,
            label: v
        }))
    ];

    const responseFormatOptions = [
        { value: '', label: '' },
        ...Object.values(ResponseFormat).map(v => ({
            value: v,
            label: v
        }))
    ];

    /** @type {import('$commonTypes').LlmConfig[]} */
    let llmConfigs = $state([]);

    /** @type {string[]} */
    let providers = $state([]);

    /** @type {import('$commonTypes').LlmModelSetting[]} */
    let models = $state([]);

    /** @type {import('$commonTypes').LabelValuePair[]} */
    let reasoningLevelOptions = $state(defaultReasonLevelOptions);

    let isReasoningModel = $derived(models.find(x => x.name === template.llm_config?.model)?.reasoning != null);

    onMount(async () => {
        try {
            const res = await getLlmConfigs();
            llmConfigs = res || [];
            const chatProviders = llmConfigs.filter(x =>
                x.models?.some(y => y.type === LlmModelType.Chat || y.capabilities?.includes(LlmModelCapability.Chat))
            );
            providers = ['', ...chatProviders.map(x => x.provider)];
            if (template.llm_config?.provider) {
                models = getLlmModels(template.llm_config.provider);
                reasoningLevelOptions = getReasoningLevelOptions(template.llm_config?.model);
            }
        } catch {
            llmConfigs = [];
            providers = [''];
        }
    });

    $effect(() => {
        const provider = template.llm_config?.provider;
        const model = template.llm_config?.model;
        untrack(() => {
            if (provider && llmConfigs.length > 0) {
                models = getLlmModels(provider);
                reasoningLevelOptions = getReasoningLevelOptions(model);
            } else {
                models = [];
                reasoningLevelOptions = defaultReasonLevelOptions;
            }
        });
    });


    /** @param {string} provider */
    function getLlmModels(provider) {
        return llmConfigs.find(x => x.provider === provider)?.models
            ?.filter(x => x.type === LlmModelType.Chat || x.capabilities?.includes(LlmModelCapability.Chat)) || [];
    }

    /** @param {any} e */
    function changeResponseFormat(e) {
        const value = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value)[0] || null;
        template.response_format = value;
        handleAgentChange();
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

    /** @param {any} e */
    function changeProvider(e) {
        const provider = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value)[0] || '';
        if (!template.llm_config) {
            template.llm_config = { provider: null, model: null };
        }
        template.llm_config.provider = provider || null;
        if (!provider) {
            models = [];
            template.llm_config.model = null;
            template.llm_config.reasoning_effort_level = null;
            reasoningLevelOptions = defaultReasonLevelOptions;
            handleAgentChange();
            return;
        }
        models = getLlmModels(provider);
        template.llm_config.model = models[0]?.name || null;
        template.llm_config.reasoning_effort_level = null;
        reasoningLevelOptions = getReasoningLevelOptions(template.llm_config.model);
        handleAgentChange();
    }

    /** @param {any} e */
    function changeModel(e) {
        const value = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value)[0] || null;
        if (!template.llm_config) {
            template.llm_config = { provider: null, model: null };
        }
        template.llm_config.model = value;
        template.llm_config.reasoning_effort_level = null;
        reasoningLevelOptions = getReasoningLevelOptions(template.llm_config.model);
        handleAgentChange();
    }

    /** @param {any} e */
    function changeMaxOutputToken(e) {
        if (!template.llm_config) {
            template.llm_config = { provider: null, model: null };
        }
        const value = Number(e.target.value) || 0;
        template.llm_config.max_output_tokens = value;
        handleAgentChange();
    }

    /** @param {any} e */
    function changeReasoningEffortLevel(e) {
        const value = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value)[0] || null;
        if (!template.llm_config) {
            template.llm_config = { provider: null, model: null };
        }
        template.llm_config.reasoning_effort_level = value;
        handleAgentChange();
    }

    /** @param {any} e */
    function validateIntegerInput(e) {
        const reg = new RegExp(INTEGER_REGEX, 'g');
        if (e.key !== 'Backspace' && !reg.test(e.key)) {
            e.preventDefault();
        }
    }
</script>

<div class="tplc-content">
    <div class="tplc-section">
        <h6 class="tplc-section-title">Template Configuration</h6>
        <div class="tplc-field">
            <label for="tpl-response-format" class="tplc-label">Response format</label>
            <Select
                tag={'tpl-response-format'}
                containerStyles={'width: 100%;'}
                placeholder={'Select a format'}
                selectedValues={template.response_format ? [template.response_format] : []}
                options={responseFormatOptions.filter(o => !!o.value)}
                onselect={e => changeResponseFormat(e)}
            />
        </div>
    </div>

    <hr class="tplc-divider" />

    <div class="tplc-section">
        <h6 class="tplc-section-title">LLM Configuration</h6>
        <div class="tplc-field">
            <label for="tpl-provider" class="tplc-label">Provider</label>
            <Select
                tag={'tpl-provider'}
                containerStyles={'width: 100%;'}
                placeholder={'Select a provider'}
                selectedValues={template.llm_config?.provider ? [template.llm_config.provider] : []}
                options={providers.filter(p => !!p).map(p => ({ label: p, value: p }))}
                onselect={e => changeProvider(e)}
            />
        </div>

        <div class="tplc-field">
            <label for="tpl-model" class="tplc-label">Model</label>
            <Select
                tag={'tpl-model'}
                containerStyles={'width: 100%;'}
                placeholder={'Select a model'}
                disabled={models.length === 0 || !template.llm_config?.provider}
                selectedValues={template.llm_config?.model ? [template.llm_config.model] : []}
                options={models.map(m => ({ label: m.name, value: m.name }))}
                onselect={e => changeModel(e)}
            />
        </div>

        <div class="tplc-field">
            <label for="tpl-max-tokens" class="tplc-label">Max output tokens</label>
            <input
                class="tplc-input"
                id="tpl-max-tokens"
                type="number"
                value={template.llm_config?.max_output_tokens || ''}
                onkeydown={e => validateIntegerInput(e)}
                onchange={e => changeMaxOutputToken(e)}
            />
        </div>

        {#if isReasoningModel}
        <div class="tplc-field">
            <label for="tpl-reasoning" class="tplc-label">Reasoning level</label>
            <Select
                tag={'tpl-reasoning'}
                containerStyles={'width: 100%;'}
                placeholder={'Select a level'}
                selectedValues={template.llm_config?.reasoning_effort_level ? [template.llm_config.reasoning_effort_level] : []}
                options={reasoningLevelOptions.filter(o => !!o.value)}
                onselect={e => changeReasoningEffortLevel(e)}
            />
        </div>
        {/if}
    </div>
</div>



