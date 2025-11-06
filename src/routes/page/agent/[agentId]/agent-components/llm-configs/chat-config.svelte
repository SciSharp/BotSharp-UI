<script>
    import { Input } from '@sveltestrap/sveltestrap';
	import { INTEGER_REGEX } from '$lib/helpers/constants';
	import { LlmModelCapability, LlmModelType, ReasoningEffortLevel } from '$lib/helpers/enums';
    
    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    /** @type {import('$commonTypes').LlmConfig[]} */
    export let llmConfigs = [];

    /** @type {() => void} */
    export let handleAgentChange = () => {};

    export const fetchConfig = () => {
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
	const reasonLevelOptions = [
        { value: '', label: '' },
        ...Object.entries(ReasoningEffortLevel).map(([k, v]) => ({
            value: v,
            label: v
        }))
    ];

    let config = agent.llm_config || {};

    /** @type {import('$commonTypes').LlmConfig[]} */
    let innerLlmConfigs = [];

    /** @type {string[]} */
    let providers = [];

    /** @type {import('$commonTypes').LlmModelSetting[]} */
    let models = [];

    $: isReasoningModel = models.find(x => x.name === config.model)?.reasoning != null;
    $: {
        if (llmConfigs.length > 0 && innerLlmConfigs.length === 0) {
            innerLlmConfigs = [...llmConfigs];
            const innerProviders = innerLlmConfigs.filter(x => x.models?.some(y => y.type === LlmModelType.Chat || y.capabilities?.includes(LlmModelCapability.Chat)));
            providers = ['', ...innerProviders.map(x => x.provider)];
            if (!!config.provider) {
                models = getLlmModels(config.provider);
            }
            const foundProvider = providers.find(x => x === config.provider);
            const foundModel = models.find(x => x.name === config.model);
            config.provider = foundProvider || null;
            config.model = foundModel?.name || null;
        }
    }

    /** @param {string} provider */
    function getLlmModels(provider) {
        return innerLlmConfigs.find(x => x.provider === provider)?.models
                             ?.filter(x => x.type === LlmModelType.Chat || x.capabilities?.includes(LlmModelCapability.Chat)) || [];
    }

    /** @param {any} e */
    async function changeProvider(e) {
        const provider = e.target.value;
        config.provider = provider || null;

        if (!!!provider) {
            models = [];
            config.model = null;
            config.reasoning_effort_level = null;
            handleAgentChange();
            return;
        }

        config.is_inherit = false;
        models = getLlmModels(provider);
        config.model = models[0]?.name;
        handleAgentChange();
    }

    /** @param {any} e */
    function changeModel(e) {
        config.is_inherit = false;
        config.model = e.target.value || null;
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
        config.reasoning_effort_level = e.target.value || null;
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

<div class="agent-config-container">
    <div class="text-center">
        <h6 class="mt-1 mb-3">Chat</h6>
        {#if agent.llm_config?.is_inherit}
            <div class="mb-3">
                <i class="bx bx-copy"></i> <span class="text-muted">Inherited</span>    
            </div>
        {/if}
    </div>

    <div class="mb-3 row llm-config-item">
        <label for="chat-provider" class="col-form-label llm-config-label">
            Provider
        </label>
        <div class="llm-config-input">
            <Input type="select" id="chat-provider" value={config.provider} on:change={e => changeProvider(e)}>
                {#each providers as option}
                    <option value={option} selected={option == config.provider}>
                        {option}
                    </option>
                {/each}
            </Input>
        </div>
    </div>
        
    <div class="mb-3 row llm-config-item">
        <label for="chat-model" class="col-form-label llm-config-label">
            Model
        </label>
        <div class="llm-config-input">
            <Input type="select" id="chat-model" value={config.model} disabled={models.length === 0} on:change={e => changeModel(e)}>
                {#each models as option}
                    <option value={option.name} selected={option.name == config.model}>
                        {option.name}
                    </option>
                {/each}
            </Input>
        </div>
    </div>

    <div class="mb-3 row llm-config-item">
        <label for="chat-max-recursive-depth" class="col-form-label llm-config-label">
            Max recursive depth
        </label>
        <div class="llm-config-input">
            <Input
                id="chat-max-recursive-depth"
                style="text-align: center;"
                type="number"
                min={recursiveDepthLowerLimit}
                value={config.max_recursion_depth}
                on:keydown={e => validateIntegerInput(e)}
                on:change={e => changeMaxRecursiveDepth(e)}
            />
        </div>
    </div>

    <div class="mb-3 row llm-config-item">
        <label for="chat-max-output-tokens" class="col-form-label llm-config-label">
            Max output tokens
        </label>
        <div class="llm-config-input">
            <Input
                id="chat-max-output-tokens"
                style="text-align: center;"
                type="number"
                value={config.max_output_tokens}
                on:keydown={e => validateIntegerInput(e)}
                on:change={e => changeMaxOutputToken(e)}
            />
        </div>
    </div>

    {#if isReasoningModel}
    <div class="mb-3 row llm-config-item">
        <label for="chat-reasoning-effort" class="col-form-label llm-config-label">
            Reasoning effort
        </label>
        <div class="llm-config-input">
            <Input type="select" id="chat-reasoning-effort" value={config.reasoning_effort_level} on:change={e => changeReasoningEffortLevel(e)}>
                {#each reasonLevelOptions as option}
                    <option value={option.value} selected={option.value == config.reasoning_effort_level}>
                        {option.label}
                    </option>
                {/each}
            </Input>
        </div>
    </div>
    {/if}
</div>