<script>
    import { afterUpdate, createEventDispatcher, onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
    import Select from '$lib/common/Select.svelte';

    const svelteDispatch = createEventDispatcher();

    /** @type {import('$commonTypes').LlmConfig[]} */
    export let llmConfigs = [];

    /** @type {boolean} */
    export let disabled = false;

    /** @type {import('$commonTypes').LlmConfig | null | undefined} */
    export let selectedProvider = null;

    /** @type {string?} */
    export let selectedModel = null;

    /** @type {import('$commonTypes').LabelValuePair[]} */
    let providerOptions = [];
    /** @type {any[]} */
    let modelOptions = [];

    afterUpdate(() => {
        if (selectedProvider) {
            onProviderChanged(selectedModel);
        } else {
            selectedModel = null;
        }
    });

    $: {
        initLlmOptions(llmConfigs);
    }

    /** @param {import('$commonTypes').LlmConfig[]} llmConfigs */
    function initLlmOptions(llmConfigs) {
        selectedProvider = null;
        selectedModel = null;
        providerOptions = [];
        modelOptions = [];

        providerOptions = llmConfigs?.map(x => ({
            label: x.provider,
            value: x.provider
        }))?.sort((a, b) => a.label.localeCompare(b.label)) || [];
    }

    /** @param {any} e */
    function selectProvider(e) {
        // @ts-ignore
		const selectedValues = e.detail.selecteds?.map(x => x.value) || [];
        selectedProvider = selectedValues.length > 0 ? llmConfigs?.find(x => x.provider === selectedValues[0]) : null;
        onProviderChanged();
        dispatchEvent();
    }

    /** @param {any} e */
    function selectModel(e) {
        // @ts-ignore
		const selectedValues = e.detail.selecteds?.map(x => x.value) || [];
        selectedModel = selectedValues.length > 0 ? modelOptions.find(x => x.value === selectedValues[0])?.value : null;
        dispatchEvent();
    }

    /** @param {string?} targetModel */
    function onProviderChanged(targetModel = null) {
        modelOptions = selectedProvider?.models?.map(x => ({
            label: x.name,
            value: x.name
        }))?.sort((a, b) => a.label.localeCompare(b.label)) || [];

        if (!!targetModel) {
            selectedModel = modelOptions.find(x => x.value === targetModel)?.value || null;
        }
    }

    function dispatchEvent() {
        svelteDispatch('selectLlm', {
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
                on:select={e => selectProvider(e)}
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
                on:select={e => selectModel(e)}
            />
        </div>
    </div>
</div>