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

<style>
    .bc-card {
        padding: 0.625rem;
        border: 1px dashed var(--color-primary);
        border-radius: 0.5rem;
        background-color: color-mix(in srgb, var(--color-primary) 3%, transparent);
    }
    .bc-header {
        text-align: center;
        cursor: pointer;
        user-select: none;
        outline: none;
    }
    .bc-header:hover .bc-header-title {
        opacity: 0.8;
    }
    .bc-header-title {
        margin: 0.25rem 0 0;
        font-size: 0.9375rem;
        font-weight: 600;
        color: rgb(55 65 81);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: opacity 0.15s ease;
    }
    .bc-body {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        margin-top: 0.75rem;
    }
    .bc-field {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
    }
    .bc-label {
        flex: 0 0 25%;
        max-width: 25%;
        padding: 0 0.75rem;
        font-size: 0.8125rem;
        font-weight: 500;
        color: rgb(75 85 99);
        overflow-x: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 0;
    }
    .bc-input-wrap {
        flex: 0 0 75%;
        max-width: 75%;
        padding: 0 0.75rem;
    }
    /* Selects are rendered via the Select component, which owns its styles */

    @media (max-width: 1250px) {
        .bc-field {
            flex-direction: column;
            align-items: stretch;
        }
        .bc-label,
        .bc-input-wrap {
            flex: 0 0 100%;
            max-width: 100%;
        }
    }

    /* ===== Dark mode ===== */
    :global(.dark) .bc-card {
        background-color: color-mix(in srgb, var(--color-primary) 6%, rgb(31 41 55));
    }
    :global(.dark) .bc-header-title {
        color: rgb(229 231 235);
    }
    :global(.dark) .bc-label {
        color: rgb(156 163 175);
    }
</style>