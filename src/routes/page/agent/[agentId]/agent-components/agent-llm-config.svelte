<script>
    import { onMount } from 'svelte';
    import { Card, CardBody, Input } from '@sveltestrap/sveltestrap';
    import { getLlmProviders, getLlmProviderModels } from '$lib/services/llm-provider-service';
    
    /** @type {string[]} */
    let providers = [];

    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    /** @type {import('$commonTypes').LlmModelSetting[]} */
    let models = [];

    /** @type {() => void} */
    export let handleAgentChange;

    const recursiveDepthLowerLimit = 1;
    const recursiveDepthUpperLimit = 10;

    let config = agent.llm_config;

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

    export const reinit = () => {
        config = agent.llm_config;
        init();
    };

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
        handleAgentChange();
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
        } else if (value > recursiveDepthUpperLimit) {
            value = recursiveDepthUpperLimit;
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
                    max={recursiveDepthUpperLimit}
                    value={config.max_recursion_depth}
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
                    on:change={e => changeMaxOutputToken(e)}
                />
            </div>
        </div>
    </CardBody>
</Card>