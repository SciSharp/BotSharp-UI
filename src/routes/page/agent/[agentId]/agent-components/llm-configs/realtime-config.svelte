<script>
    import { Input } from '@sveltestrap/sveltestrap';
	import { LlmModelCapability, LlmModelType } from '$lib/helpers/enums';
    
    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    /** @type {import('$commonTypes').LlmConfig[]} */
    export let llmConfigs = [];

    /** @type {() => void} */
    export let handleAgentChange = () => {};

    export const fetchConfig = () => {
        if (!config.provider && !config.model) {
            return null;
        }

        return {
            ...config,
            provider: config.provider || null,
            model: config.model || null
        };
    }

    let config = agent.llm_config?.realtime || {};

    /** @type {import('$commonTypes').LlmConfig[]} */
    let innerLlmConfigs = [];

    /** @type {string[]} */
    let providers = [];

    /** @type {import('$commonTypes').LlmModelSetting[]} */
    let models = [];

    $: {
        if (llmConfigs.length > 0 && innerLlmConfigs.length === 0) {
            innerLlmConfigs = llmConfigs;
            const innerProviders = innerLlmConfigs.filter(x => x.models?.some(y => y.type === LlmModelType.Realtime || y.capabilities?.includes(LlmModelCapability.Realtime)));
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
                             ?.filter(x => x.type === LlmModelType.Realtime || x.capabilities?.includes(LlmModelCapability.Realtime)) || [];
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

        models = getLlmModels(provider);
        config.model = models[0]?.name;
        handleAgentChange();
    }

    /** @param {any} e */
    function changeModel(e) {
        config.model = e.target.value || null;
        handleAgentChange();
    }
</script>

<div class="agent-config-container">
    <div class="text-center">
        <h6 class="mt-1 mb-2">Realtime</h6>
    </div>

    <div class="mb-3 row">
        <label for="example-large" class="col-md-3 col-form-label">
            Provider
        </label>
        <div class="col-md-9 config-item-container">
            <Input type="select" value={config.provider} on:change={e => changeProvider(e)}>
                {#each providers as option}
                    <option value={option} selected={option == config.provider}>
                        {option}
                    </option>
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
                    <option value={option.name} selected={option.name == config.model}>
                        {option.name}
                    </option>
                {/each}
            </Input>
        </div>
    </div>
</div>