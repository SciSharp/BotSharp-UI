<script>
    import { Button, Card, CardBody, CardHeader, Col } from '@sveltestrap/sveltestrap';
    import { getLlmProviders, getLlmProviderModels } from '$lib/services/llm-provider-service';
    import { onMount } from 'svelte';

    /** @type {string[]} */
    let options = [];

    /** @type {import('$types').AgentModel} */
    export let agent;

    /** @type {import('$types').LlmModelSetting[]} */
    let models = []

    let config = agent.llm_config;

    onMount(async () =>{
        options = await getLlmProviders();
        models = await getLlmProviderModels(config.provider);
    });

    /** @param {string} provider */
    async function handleProviderChanged(provider) {
        config.is_inherit = false;
        models = await getLlmProviderModels(provider);
    }
</script>

<Card>
    <CardBody>
        <div class="text-center">
            <h5 class="mt-1 mb-3">LLM Config</h5>
            <img src="/images/brands/azure-openai-logo.avif" alt="" height="50" />
            {#if agent.llm_config?.is_inherit}
            <i class="bx bx-copy"></i> <span class="text-muted">Inherited</span>    
            {/if}
        </div>

        <div class="mb-3 row">
            <label class="col-md-3 col-form-label" for="example-large">Provider</label>
            <div class="col-md-9">
                <select class="form-select" bind:value={config.provider} on:change={() => handleProviderChanged(config.provider)}>
                {#each options as option}
                    <option value={option}>{option}</option>
                {/each}
                </select>
            </div>
        </div>
        
        <div class="mb-3 row">
            <label for="example-text-input" class="col-md-3 col-form-label">
                Model
            </label>
            <div class="col-md-9">
                <select class="form-select" bind:value={config.model} on:change={() => config.is_inherit = false}>
                    {#each models as option}
                        <option value={option.name}>{option.name}</option>
                    {/each}
                </select>                
            </div>
        </div>
    </CardBody>
</Card>