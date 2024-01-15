<script>
    import { Button, Card, CardBody, CardHeader, Col } from '@sveltestrap/sveltestrap';

    let options = [
        { id: 1, name: 'azure-openai' },
        { id: 2, name: 'google-ai' },
        { id: 3, name: 'llama-sharp' },
    ]
    /** @type {import('$types').AgentModel} */
    export let agent;
    let config = agent.llm_config;
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
                <select class="form-select" bind:value={config.provider} on:change={() => config.is_inherit = false}>
                {#each options as option}
                    <option value={option.name}>{option.name}</option>
                {/each}
                </select>
            </div>
        </div>
        
        <div class="mb-3 row">
            <label for="example-text-input" class="col-md-3 col-form-label">
                Model
            </label>
            <div class="col-md-9">
                <input class="form-control" type="text" bind:value={config.model} on:change={() => config.is_inherit = false}/>
            </div>
        </div>
    </CardBody>
</Card>