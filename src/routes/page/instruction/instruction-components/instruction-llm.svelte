<script>
    import Select from '$lib/common/dropdowns/Select.svelte';

    /**
     * @type {{
     *   llmConfigs?: import('$commonTypes').LlmConfig[],
     *   disabled?: boolean,
     *   selectedProvider?: import('$commonTypes').LlmConfig | null | undefined,
     *   selectedModel?: string | null,
     *   onSelectLlm?: (detail: { provider: import('$commonTypes').LlmConfig | null, model: string | null }) => void
     * }}
     */
    let {
        llmConfigs = [],
        disabled = false,
        selectedProvider = $bindable(null),
        selectedModel = $bindable(null),
        onSelectLlm
    } = $props();

    /** @type {import('$commonTypes').LabelValuePair[]} */
    let providerOptions = $derived(
        llmConfigs?.map(x => ({
            label: x.provider,
            value: x.provider
        }))?.sort((a, b) => a.label.localeCompare(b.label)) || []
    );

    /** @type {any[]} */
    let modelOptions = $derived(
        selectedProvider?.models?.map(x => ({
            label: x.name,
            value: x.name
        }))?.sort((a, b) => a.label.localeCompare(b.label)) || []
    );

    /** @param {any} e */
    function selectProvider(e) {
        // @ts-ignore
		const selectedValues = e.detail.selecteds?.map(x => x.value) || [];
        selectedProvider = selectedValues.length > 0 ? llmConfigs?.find(x => x.provider === selectedValues[0]) || null : null;
        selectedModel = null;
        fireSelectLlm();
    }

    /** @param {any} e */
    function selectModel(e) {
        // @ts-ignore
		const selectedValues = e.detail.selecteds?.map(x => x.value) || [];
        selectedModel = selectedValues.length > 0 ? modelOptions.find(x => x.value === selectedValues[0])?.value : null;
        fireSelectLlm();
    }

    function fireSelectLlm() {
        onSelectLlm?.({
            provider: selectedProvider || null,
            model: selectedModel
        });
    }
</script>


<div class="flex flex-col gap-5 py-3">
    <div>
        <label for="provider-select" class="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <i class="mdi mdi-cloud-outline text-sm leading-none"></i>
            Provider
        </label>
        <Select
            tag={'provider-select'}
            placeholder={'Select Provider'}
            searchMode
            disabled={disabled}
            selectedValues={selectedProvider?.provider ? [selectedProvider.provider] : []}
            options={providerOptions}
            onselect={e => selectProvider(e)}
        />
    </div>

    <div>
        <label for="model-select" class="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <i class="mdi mdi-chip text-sm leading-none"></i>
            Model
        </label>
        <Select
            tag={'model-select'}
            placeholder={'Select Model'}
            searchMode
            disabled={disabled}
            selectedValues={selectedModel ? [selectedModel] : []}
            options={modelOptions}
            onselect={e => selectModel(e)}
        />
    </div>
</div>