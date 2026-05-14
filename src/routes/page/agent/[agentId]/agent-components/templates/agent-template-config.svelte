<script>
    import { onMount } from 'svelte';
    import { untrack } from 'svelte';
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

<div class="tplc-content">
    <div class="tplc-section">
        <h6 class="tplc-section-title">Template Configuration</h6>
        <div class="tplc-field">
            <label for="tpl-response-format" class="tplc-label">Response format</label>
            <select class="tplc-select" id="tpl-response-format"
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

    <hr class="tplc-divider" />

    <div class="tplc-section">
        <h6 class="tplc-section-title">LLM Configuration</h6>
        <div class="tplc-field">
            <label for="tpl-provider" class="tplc-label">Provider</label>
            <select class="tplc-select" id="tpl-provider"
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

        <div class="tplc-field">
            <label for="tpl-model" class="tplc-label">Model</label>
            <select class="tplc-select" id="tpl-model"
                value={template.llm_config?.model || ''}
                disabled={models.length === 0 || !template.llm_config?.provider}
                onchange={e => changeModel(e)}
            >
                {#each models as option}
                    <option value={option.name} selected={option.name === (template.llm_config?.model || '')}>
                        {option.name}
                    </option>
                {/each}
            </select>
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
            <select class="tplc-select" id="tpl-reasoning"
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

<style>
    .tplc-content {
        padding: 0.625rem;
        display: flex;
        flex-direction: column;
        height: 100%;
    }
    .tplc-section {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
    }
    .tplc-section-title {
        margin: 0 0 0.25rem 0;
        font-size: 0.8125rem;
        font-weight: 600;
        color: rgb(55 65 81);
    }
    .tplc-divider {
        border: 0;
        border-top: 1px solid rgb(229 231 235);
        margin: 0.5rem 0;
    }
    .tplc-field {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
    }
    .tplc-label {
        font-size: 0.75rem;
        font-weight: 500;
        margin-bottom: 0;
        white-space: nowrap;
        color: rgb(75 85 99);
    }

    /* ===== Inputs & selects ===== */
    .tplc-input,
    .tplc-select {
        width: 100%;
        padding: 0.3125rem 0.5rem;
        font-size: 0.75rem;
        line-height: 1.4;
        color: rgb(17 24 39);
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.375rem;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
        font-family: inherit;
    }
    .tplc-input:focus,
    .tplc-select:focus {
        outline: 0;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }
    .tplc-select {
        appearance: none;
        -webkit-appearance: none;
        background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.4rem center;
        background-size: 0.75rem;
        padding-right: 1.5rem;
    }
    .tplc-select:disabled {
        background-color: rgb(243 244 246);
        cursor: not-allowed;
        color: var(--color-muted);
    }
    .tplc-input::-webkit-outer-spin-button,
    .tplc-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    /* ===== Dark mode ===== */
    :global(.dark) .tplc-section-title {
        color: rgb(229 231 235);
    }
    :global(.dark) .tplc-label {
        color: rgb(156 163 175);
    }
    :global(.dark) .tplc-divider {
        border-top-color: rgb(55 65 81);
    }
    :global(.dark) .tplc-input,
    :global(.dark) .tplc-select {
        background-color: rgb(17 24 39);
        border-color: rgb(55 65 81);
        color: rgb(229 231 235);
    }
    :global(.dark) .tplc-select {
        background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3E%3C/svg%3E");
    }
    :global(.dark) .tplc-select:disabled {
        background-color: rgb(31 41 55);
    }
</style>

