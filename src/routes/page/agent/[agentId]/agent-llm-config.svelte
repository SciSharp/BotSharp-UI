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

    const lowerLimit = 1;
    const upperLimit = 10;

    let config = agent.llm_config;

    onMount(async () =>{
        providers = await getLlmProviders();
        providers = ['', ...providers]
        if (!!config.provider) {
            models = await getLlmProviderModels(config.provider);
        }
        init();
    });

    function init() {
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
            return;
        }

        config.is_inherit = false;
        models = await getLlmProviderModels(provider);
        config.model = models[0]?.name;
    }

    /** @param {any} e */
    function changeModel(e) {
        config.is_inherit = false;
        config.model = e.target.value || null;
    }

    /** @param {any} e */
    function changeMaxRecursiveDepth(e) {
        let value = Number(e.target.value) || 0;
        
        if (value < lowerLimit) {
            value = lowerLimit;
        } else if (value > upperLimit) {
            value = upperLimit;
        }

        config.max_recursion_depth = value;
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
                Maximum recursive depth
            </label>
            <div class="col-md-9">
                <Input type="number" min={lowerLimit} max={upperLimit} style="text-align: center;" value={config.max_recursion_depth} on:change={e => changeMaxRecursiveDepth(e)} />              
            </div>
        </div>
    </CardBody>
</Card>