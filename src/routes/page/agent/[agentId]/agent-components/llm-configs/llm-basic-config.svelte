<script>
    import { slide } from 'svelte/transition';
    import Select from '$lib/common/dropdowns/Select.svelte';

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
        const values = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value) || [];
        const provider = values[0] || '';
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
        const values = e?.detail?.selecteds?.map((/** @type {any} */ x) => x.value) || [];
        config.model = values[0] || null;
        handleAgentChange();
    }
</script>

<div class="bc-card">
    <div
        class="bc-header"
        role="button"
        tabindex="0"
        onclick={() => collapsed = !collapsed}
        onkeydown={(e) => e.key === 'Enter' && (collapsed = !collapsed)}
    >
        <h6 class="bc-header-title">
            <i class="mdi {collapsed ? 'mdi-chevron-right' : 'mdi-chevron-down'}"></i>
            {title}
        </h6>
    </div>

    {#if !collapsed}
    <div transition:slide={{ duration: 200 }} class="bc-body">
        <div class="bc-field">
            <label for={`provider-${title}`} class="bc-label">
                Provider
            </label>
            <div class="bc-input-wrap">
                <Select
                    tag={`provider-${title}`}
                    containerStyles={'width: 100%;'}
                    placeholder={'Select a provider'}
                    selectedValues={config.provider ? [config.provider] : []}
                    options={providers.filter(p => !!p).map(p => ({ label: p, value: p }))}
                    onselect={e => changeProvider(e)}
                />
            </div>
        </div>

        <div class="bc-field">
            <label for={`model-${title}`} class="bc-label">
                Model
            </label>
            <div class="bc-input-wrap">
                <Select
                    tag={`model-${title}`}
                    containerStyles={'width: 100%;'}
                    placeholder={'Select a model'}
                    disabled={models.length === 0}
                    selectedValues={config.model ? [config.model] : []}
                    options={models.map(m => ({ label: m.name, value: m.name }))}
                    onselect={e => changeModel(e)}
                />
            </div>
        </div>
    </div>
    {/if}
</div>

