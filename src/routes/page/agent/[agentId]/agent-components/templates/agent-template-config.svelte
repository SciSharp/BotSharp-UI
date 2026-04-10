<script>
    import { onMount } from 'svelte';
    import { INTEGER_REGEX } from '$lib/helpers/constants';
    import { LlmModelCapability, LlmModelType, ReasoningEffortLevel, ResponseFormat } from '$lib/helpers/enums';
    import { getLlmConfigs } from '$lib/services/llm-provider-service';

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

    /** @param {string} provider */
    function getLlmModels(provider) {
        return llmConfigs.find(x => x.provider === provider)?.models
            ?.filter(x => x.type === LlmModelType.Chat || x.capabilities?.includes(LlmModelCapability.Chat)) || [];
    }

    /** @param {any} e */
    function changeResponseFormat(e) {
        template.response_format = e.target.value || null;
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
        const provider = e.target.value;
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
        if (!template.llm_config) {
            template.llm_config = { provider: null, model: null };
        }
        template.llm_config.model = e.target.value || null;
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
        if (!template.llm_config) {
            template.llm_config = { provider: null, model: null };
        }
        template.llm_config.reasoning_effort_level = e.target.value || null;
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

<div class="template-config-content">
    <div class="config-section">
        <h6 class="fw-semibold">Template Configuration</h6>
        <div class="config-field">
            <label for="tpl-response-format" class="form-label config-label">Response format</label>
            <select class="form-select form-select-sm" id="tpl-response-format"
                value={template.response_format || ''}
                onchange={e => changeResponseFormat(e)}
            >
                {#each responseFormatOptions as option}
                    <option value={option.value} selected={option.value === (template.response_format || '')}>
                        {option.label}
                    </option>
                {/each}
            </select>
        </div>
    </div>

    <hr class="my-2" />

    <div class="config-section">
        <h6 class="fw-semibold">LLM Configuration</h6>
        <div class="config-field">
            <label for="tpl-provider" class="form-label config-label">Provider</label>
            <select class="form-select form-select-sm" id="tpl-provider"
                value={template.llm_config?.provider || ''}
                onchange={e => changeProvider(e)}
            >
                {#each providers as option}
                    <option value={option} selected={option === (template.llm_config?.provider || '')}>
                        {option}
                    </option>
                {/each}
            </select>
        </div>

        <div class="config-field">
            <label for="tpl-model" class="form-label config-label">Model</label>
            <select class="form-select form-select-sm" id="tpl-model"
                value={template.llm_config?.model || ''}
                disabled={models.length === 0}
                onchange={e => changeModel(e)}
            >
                {#each models as option}
                    <option value={option.name} selected={option.name === (template.llm_config?.model || '')}>
                        {option.name}
                    </option>
                {/each}
            </select>
        </div>

        <div class="config-field">
            <label for="tpl-max-tokens" class="form-label config-label">Max output tokens</label>
            <input
                class="form-control form-control-sm"
                id="tpl-max-tokens"
                type="number"
                value={template.llm_config?.max_output_tokens || ''}
                onkeydown={e => validateIntegerInput(e)}
                onchange={e => changeMaxOutputToken(e)}
            />
        </div>

        {#if isReasoningModel}
        <div class="config-field">
            <label for="tpl-reasoning" class="form-label config-label">Reasoning level</label>
            <select class="form-select form-select-sm" id="tpl-reasoning"
                value={template.llm_config?.reasoning_effort_level || ''}
                onchange={e => changeReasoningEffortLevel(e)}
            >
                {#each reasoningLevelOptions as option}
                    <option value={option.value} selected={option.value === (template.llm_config?.reasoning_effort_level || '')}>
                        {option.label}
                    </option>
                {/each}
            </select>
        </div>
        {/if}
    </div>
</div>

