<script>
    import { afterUpdate, createEventDispatcher, onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
    import Select from '$lib/common/Select.svelte';

    const svelteDispatch = createEventDispatcher();

    /** @type {import('$commonTypes').LlmConfig[]} */
    export let llmConfigs = [];

    /** @type {boolean} */
    export let disabled = false;

    /** @type {import('$commonTypes').LlmConfig?} */
    export let selectedProvider = null;

    /** @type {any} */
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
        collectLlmOptions(llmConfigs);
    }

    /** @param {import('$commonTypes').LlmConfig[]} llmConfigs */
    function collectLlmOptions(llmConfigs) {
        providerOptions = llmConfigs?.map(x => ({
            label: x.provider,
            value: x.provider
        }))?.sort((a, b) => a.label.localeCompare(b.label)) || [];
    }

    /** @param {any} e */
    function selectProvider(e) {
        // @ts-ignore
		const selectedValues = e.detail.selecteds?.map(x => x.value) || [];
        selectedProvider = llmConfigs?.find(x => x.provider === selectedValues[0]) || null;
        onProviderChanged();
        disPatchEvent();
    }

    /** @param {any} e */
    function selectModel(e) {
        // @ts-ignore
		const selectedValues = e.detail.selecteds?.map(x => x.value) || [];
        selectedModel = modelOptions.find(x => x.id === selectedValues[0]);
        disPatchEvent();
    }

    /** @param {any?} targetModel */
    function onProviderChanged(targetModel = null) {
        modelOptions = selectedProvider?.models?.map(x => ({
            id: x.name,
            name: x.name,
            label: x.name,
            value: x.name
        }))?.sort((a, b) => a.label.localeCompare(b.label)) || [];

        if (!!targetModel) {
            selectedModel = modelOptions.find(x => x.value === targetModel) || null;
        } else {
            selectedModel = modelOptions.length > 0 ? modelOptions[0] : null;
        }
    }

    function disPatchEvent() {
        svelteDispatch('llmSelected', {
            provider: selectedProvider,
            model: selectedModel?.name
        });
    }
</script>


<div class="instruct-setting-section instruct-setting-padding">
    <div class="instruct-setting-item">
        <div class="instruct-setting-dropdown">
            <div class="text-primary fw-bold mb-1">Provider</div>
            <!-- <select class="form-select" id="provider" value={selectedProvider?.provider || null} disabled={disabled} on:change={e => selectProvider(e)}>
                <option value={null} disabled selected>{$_('Select Provider')}</option>
                {#each providerOptions as op}
                    <option value={`${op.id}`} selected={op.id === selectedProvider?.provider}>{$_(`${op.name}`)}</option>
                {/each}
            </select> -->
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
            <!-- <select class="form-select" id="model" value={selectedModel?.id || null} disabled={disabled} on:change={e => selectModel(e)}>
                <option value={null} disabled selected>{$_('Select Model')}</option>
                {#each modelOptions as op}
                    <option value={`${op.id}`} selected={op.id === selectedModel?.id}>{$_(`${op.name}`)}</option>
                {/each}
            </select> -->
            <Select
                tag={'model-select'}
                placeholder={'Select Model'}
                searchMode
                disabled={disabled}
                selectedValues={selectedModel?.id ? [selectedModel.id] : []}
                options={modelOptions}
                on:select={e => selectModel(e)}
            />
        </div>
    </div>
</div>