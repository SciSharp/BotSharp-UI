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


<div class="instruct-setting-section instruct-setting-padding">
    <div class="instruct-setting-item">
        <div class="instruct-setting-dropdown">
            <div class="text-primary fw-bold mb-1">Provider</div>
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
    </div>

    <div class="instruct-setting-item">
        <div class="instruct-setting-dropdown">
            <div class="text-primary fw-bold mb-1">Model</div>
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
</div>