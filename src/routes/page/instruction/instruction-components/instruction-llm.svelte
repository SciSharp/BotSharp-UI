<script>
    import Select from '$lib/common/dropdowns/Select.svelte';
    import { INTEGER_REGEX } from '$lib/helpers/constants';
    import { ReasoningEffortLevel } from '$lib/helpers/enums';

    /**
     * @type {{
     *   llmConfigs?: import('$commonTypes').LlmConfig[],
     *   disabled?: boolean,
     *   selectedProvider?: import('$commonTypes').LlmConfig | null | undefined,
     *   selectedModel?: string | null,
     *   selectedReasoningEffortLevel?: string | null,
     *   selectedMaxOutputTokens?: number | null,
     *   onSelectLlm?: (detail: { provider: import('$commonTypes').LlmConfig | null, model: string | null, reasoning_effort_level: string | null, max_output_tokens: number | null }) => void
     * }}
     */
    let {
        llmConfigs = [],
        disabled = false,
        selectedProvider = $bindable(null),
        selectedModel = $bindable(null),
        selectedReasoningEffortLevel = $bindable(null),
        selectedMaxOutputTokens = $bindable(null),
        onSelectLlm
    } = $props();

    /** @type {import('$commonTypes').LabelValuePair[]} */
    const defaultReasonLevelOptions = Object.entries(ReasoningEffortLevel).map(([k, v]) => ({
        value: v,
        label: v
    }));

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

    let selectedModelSetting = $derived(
        selectedProvider?.models?.find(x => x.name === selectedModel) || null
    );

    let isReasoningModel = $derived(selectedModelSetting?.reasoning != null);

    /** @type {import('$commonTypes').LabelValuePair[]} */
    let reasoningLevelOptions = $derived.by(() => {
        if (!isReasoningModel) {
            return defaultReasonLevelOptions;
        }
        const customOptions = selectedModelSetting?.reasoning?.parameters?.EffortLevel?.options;
        if (customOptions?.length > 0) {
            // @ts-ignore
            return customOptions.map(x => ({ value: x, label: x }));
        }
        return defaultReasonLevelOptions;
    });

    /** @param {any} e */
    function selectProvider(e) {
        // @ts-ignore
		const selectedValues = e.detail.selecteds?.map(x => x.value) || [];
        selectedProvider = selectedValues.length > 0 ? llmConfigs?.find(x => x.provider === selectedValues[0]) || null : null;
        selectedModel = null;
        selectedReasoningEffortLevel = null;
        fireSelectLlm();
    }

    /** @param {any} e */
    function selectModel(e) {
        // @ts-ignore
		const selectedValues = e.detail.selecteds?.map(x => x.value) || [];
        selectedModel = selectedValues.length > 0 ? modelOptions.find(x => x.value === selectedValues[0])?.value : null;
        selectedReasoningEffortLevel = null;
        fireSelectLlm();
    }

    /** @param {any} e */
    function selectReasoningEffortLevel(e) {
        // @ts-ignore
        const selectedValues = e.detail.selecteds?.map(x => x.value) || [];
        selectedReasoningEffortLevel = selectedValues.length > 0 ? selectedValues[0] : null;
        fireSelectLlm();
    }

    /** @param {any} e */
    function changeMaxOutputTokens(e) {
        const value = Number(e.target.value) || 0;
        selectedMaxOutputTokens = value > 0 ? value : null;
        fireSelectLlm();
    }

    /** @param {any} e */
    function validateIntegerInput(e) {
        const reg = new RegExp(INTEGER_REGEX, 'g');
        if (e.key !== 'Backspace' && !reg.test(e.key)) {
            e.preventDefault();
        }
    }

    function fireSelectLlm() {
        onSelectLlm?.({
            provider: selectedProvider || null,
            model: selectedModel,
            reasoning_effort_level: selectedReasoningEffortLevel || null,
            max_output_tokens: selectedMaxOutputTokens || null
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

    <div>
        <label for="max-output-tokens" class="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <i class="mdi mdi-counter text-sm leading-none"></i>
            Max output tokens
        </label>
        <input
            id="max-output-tokens"
            type="number"
            class="form-control block w-full"
            disabled={disabled}
            value={selectedMaxOutputTokens || ''}
            onkeydown={e => validateIntegerInput(e)}
            onchange={e => changeMaxOutputTokens(e)}
        />
    </div>

    {#if isReasoningModel}
    <div>
        <label for="reasoning-effort-select" class="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <i class="mdi mdi-brain text-sm leading-none"></i>
            Reasoning level
        </label>
        <Select
            tag={'reasoning-effort-select'}
            placeholder={'Select a level'}
            disabled={disabled}
            selectedValues={selectedReasoningEffortLevel ? [selectedReasoningEffortLevel] : []}
            options={reasoningLevelOptions}
            onselect={e => selectReasoningEffortLevel(e)}
        />
    </div>
    {/if}
</div>