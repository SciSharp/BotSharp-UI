<script>
    import { onMount } from 'svelte';
    import { Card, CardBody, Input } from '@sveltestrap/sveltestrap';
    import { getLlmProviders, getLlmProviderModels } from '$lib/services/llm-provider-service';
	import { INTEGER_REGEX } from '$lib/helpers/constants';
	import { ReasoningEffortLevel } from '$lib/helpers/enums';
    
    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    /** @type {() => void} */
    export let handleAgentChange = () => {};

    export const fetchLlmConfig = () => {
        return {
            ...config,
            max_output_tokens: Number(config.max_output_tokens) > 0 ? Number(config.max_output_tokens) : null
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

    let config = agent.llm_config;

    /** @type {string[]} */
    let providers = [];

    /** @type {import('$commonTypes').LlmModelSetting[]} */
    let models = [];

    onMount(async () =>{
        await init();
    });

    async function init() {
        providers = await getLlmProviders();
        providers = ['', ...providers]
        if (!!config.provider) {
            models = await getLlmProviderModels(config.provider);
        }
        const foundProvider = providers.find(x => x === config.provider);
        const foundModel = models.find(x => x.name === config.model);
        config.provider = foundProvider || null;
        config.model = foundModel?.name || null;
    }

    

    /** @param {any} e */
    async function changeProvider(e) {
        const provider = e.target.value;
        config.provider = provider || null;

        if (!!!provider) {
            models = [];
            config.model = null;
            handleAgentChange();
            return;
        }

        config.is_inherit = false;
        models = await getLlmProviderModels(provider);
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

<Card>
    <CardBody>
        <div class="text-center">
            <h5 class="mt-1 mb-3">LLM Config</h5>
            <img src="images/brands/azure-openai-logo.avif" alt="" height="50" />
            {#if agent.llm_config?.is_inherit}
                <i class="bx bx-copy"></i> <span class="text-muted">Inherited</span>    
            {/if}
        </div>

        <div class="mb-3 row">
            <label for="example-large" class="col-md-3 col-form-label">
                Provider
            </label>
            <div class="col-md-9 config-item-container">
                <Input type="select" value={config.provider} on:change={e => changeProvider(e)}>
                    {#each providers as option}
                        <option value={option} selected={option == config.provider}>{option}</option>
                    {/each}
                </Input>
            </div>
        </div>
        
        <div class="mb-3 row">
            <label for="example-text-input" class="col-md-3 col-form-label">
                Model
            </label>
            <div class="col-md-9">
                <Input type="select" value={config.model} disabled={models.length === 0} on:change={e => changeModel(e)}>
                    {#each models as option}
                        <option value={option.name} selected={option.name == config.model}>{option.name}</option>
                    {/each}
                </Input>
            </div>
        </div>

        <div class="mb-3 row">
            <label for="example-text-input" class="col-md-3 col-form-label">
                Max recursive depth
            </label>
            <div class="col-md-9">
                <Input
                    style="text-align: center;"
                    type="number"
                    min={recursiveDepthLowerLimit}
                    value={config.max_recursion_depth}
                    on:keydown={e => validateIntegerInput(e)}
                    on:change={e => changeMaxRecursiveDepth(e)}
                />
            </div>
        </div>

        <div class="mb-3 row">
            <label for="example-text-input" class="col-md-3 col-form-label">
                Max output tokens
            </label>
            <div class="col-md-9">
                <Input
                    style="text-align: center;"
                    type="number"
                    value={config.max_output_tokens}
                    on:keydown={e => validateIntegerInput(e)}
                    on:change={e => changeMaxOutputToken(e)}
                />
            </div>
        </div>

        <div class="mb-3 row">
            <label for="example-text-input" class="col-md-3 col-form-label">
                Reasoning effort
            </label>
            <div class="col-md-9">
                <Input type="select" value={config.reasoning_effort_level} on:change={e => changeReasoningEffortLevel(e)}>
                    {#each reasonLevelOptions as option}
                        <option value={option.value} selected={option.value == config.reasoning_effort_level}>
                            {option.label}
                        </option>
                    {/each}
                </Input>
            </div>
        </div>
    </CardBody>
</Card>