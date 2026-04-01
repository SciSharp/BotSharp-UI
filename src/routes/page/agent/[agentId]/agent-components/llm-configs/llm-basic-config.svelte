<script>
    import { slide } from 'svelte/transition';

    /**
     * @type {{
     *   title: string,
     *   modelType?: string,
     *   modelCapability: string,
     *   llmConfig?: any,
     *   llmConfigOptions?: import('$commonTypes').LlmConfig[],
     *   handleAgentChange?: () => void
     * }}
     */
    let {
        title,
        modelType = '',
        modelCapability,
        llmConfig,
        llmConfigOptions = [],
        handleAgentChange = () => {}
    } = $props();

    export function fetchConfig() {
        if (!config.provider && !config.model) {
            return null;
        }

        return {
            ...config,
            provider: config.provider || null,
            model: config.model || null
        };
    }

    /** @type {boolean} */
    let collapsed = $state(true);

    /** @type {import('$commonTypes').LlmConfig[]} */
    let innerLlmConfigOptions = $state([]);

    /** @type {string[]} */
    let providers = $state([]);

    /** @type {import('$commonTypes').LlmModelSetting[]} */
    let models = $state([]);

    // svelte-ignore state_referenced_locally
    let config = $state(llmConfig || {});

    $effect(() => {
        if (llmConfigOptions.length > 0 && innerLlmConfigOptions.length === 0) {
            innerLlmConfigOptions = llmConfigOptions;
            const innerProviders = innerLlmConfigOptions.filter(x => x.models?.some(y => (!!modelType && y.type === modelType) || y.capabilities?.includes(modelCapability)));
            providers = ['', ...innerProviders.map(x => x.provider)];
            if (config.provider) {
                models = getLlmModels(config.provider);
            }
            const foundProvider = providers.find(x => x === config.provider);
            const foundModel = models.find(x => x.name === config.model);
            config.provider = foundProvider || null;
            config.model = foundModel?.name || null;
        }
    });

    /** @param {string} provider */
    function getLlmModels(provider) {
        return innerLlmConfigOptions.find(x => x.provider === provider)?.models
                                   ?.filter(x => (!!modelType && x.type === modelType) || x.capabilities?.includes(modelCapability)) || [];
    }

    /** @param {any} e */
    async function changeProvider(e) {
        const provider = e.target.value;
        config.provider = provider || null;

        if (!provider) {
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
    <div
        class="config-header text-center"
        role="button"
        tabindex="0"
        onclick={() => collapsed = !collapsed}
        onkeydown={(e) => e.key === 'Enter' && (collapsed = !collapsed)}
    >
        <h6 class="mt-1 mb-3 d-flex align-items-center justify-content-center gap-2">
            <i class="mdi {collapsed ? 'mdi-chevron-right' : 'mdi-chevron-down'}"></i>
            {title}
        </h6>
    </div>

    {#if !collapsed}
    <div transition:slide={{ duration: 200 }}>
        <div class="mb-3 row llm-config-item">
            <label for={`provider-${title}`} class="col-form-label llm-config-label">
                Provider
            </label>
            <div class="llm-config-input">
                <select class="form-select" id={`provider-${title}`} value={config.provider} onchange={e => changeProvider(e)}>
                    {#each providers as option}
                        <option value={option} selected={option == config.provider}>
                            {option}
                        </option>
                    {/each}
                </select>
            </div>
        </div>

        <div class="mb-3 row llm-config-item">
            <label for={`model-${title}`} class="col-form-label llm-config-label">
                Model
            </label>
            <div class="llm-config-input">
                <select class="form-select" id={`model-${title}`} value={config.model} disabled={models.length === 0} onchange={e => changeModel(e)}>
                    {#each models as option}
                        <option value={option.name} selected={option.name == config.model}>
                            {option.name}
                        </option>
                    {/each}
                </select>
            </div>
        </div>
    </div>
    {/if}
</div>