<script>
    import { Button, Card, CardBody, CardHeader, Col } from 'sveltestrap';

    /** @type {import('$types').AgentModel} */
    export let agent;
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
                <select class="form-select" value="{agent.llm_config?.provider}">
                <option>Select</option>
                <option>azure-openai</option>
                <option>google-ai</option>
                <option>llama-sharp</option>
                </select>
            </div>
        </div>
        
        <div class="mb-3 row">
            <label for="example-text-input" class="col-md-3 col-form-label">
                Model
            </label>
            <div class="col-md-9">
                <input class="form-control" type="text" value="{agent.llm_config?.model}"/>
            </div>
        </div>
    </CardBody>
</Card>