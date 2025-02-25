<script>
    import { afterUpdate, createEventDispatcher, onMount } from 'svelte';
	import { _ } from 'svelte-i18n';

    const svelteDispatch = createEventDispatcher();

    /** @type {import('$commonTypes').LlmConfig[]} */
    export let llmConfigs = [];

    /** @type {boolean} */
    export let disabled = false;

    /** @type {import('$commonTypes').LlmConfig?} */
    export let selectedProvider = null;

    /** @type {any} */
    export let selectedModel = null;

    /** @type {any[]} */
    let providerOptions = [];
    /** @type {any[]} */
    let modelOptions = [];

    afterUpdate(() => {
        if (selectedProvider) {
            onProviderChanged();
        }
    });

    $: {
        collectLlmOptions(llmConfigs);
    }

    /** @param {import('$commonTypes').LlmConfig[]} llmConfigs */
    function collectLlmOptions(llmConfigs) {
        providerOptions = llmConfigs?.map(x => ({
            id: x.provider,
            name: x.provider
        }))?.sort((a, b) => a.name.localeCompare(b.name)) || [];
    }

    /** @param {any} e */
    function selectProvider(e) {
        const selected = e.target.value || null;
        selectedProvider = llmConfigs?.find(x => x.provider === selected) || null;
        onProviderChanged();
        console.log(selectedModel, modelOptions);
        disPatchEvent();
    }

    /** @param {any} e */
    function selectModel(e) {
        const selected = e.target.value || null;
        selectedModel = modelOptions.find(x => x.id === selected);
        disPatchEvent();
    }

    /** @param {any?} targetModel */
    function onProviderChanged(targetModel = null) {
        modelOptions = selectedProvider?.models?.map(x => ({
            id: x.name,
            name: x.name
        }))?.sort((a, b) => a.name.localeCompare(b.name)) || [];

        if (!!targetModel) {
            selectedModel = modelOptions.find(x => x.name === targetModel) || null;
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
            <select class="form-select" id="provider" value={selectedProvider?.provider || null} disabled={disabled} on:change={e => selectProvider(e)}>
                <option value={null} disabled selected>{$_('Select Provider')}</option>
                {#each providerOptions as op}
                    <option value={`${op.id}`} selected={op.id === selectedProvider?.provider}>{$_(`${op.name}`)}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="instruct-setting-item">
        <div class="instruct-setting-dropdown">
            <div class="text-primary fw-bold mb-1">Model</div>
            <select class="form-select" id="model" value={selectedModel?.id || null} disabled={disabled} on:change={e => selectModel(e)}>
                <option value={null} disabled selected>{$_('Select Model')}</option>
                {#each modelOptions as op}
                    <option value={`${op.id}`} selected={op.id === selectedModel?.id}>{$_(`${op.name}`)}</option>
                {/each}
            </select>
        </div>
    </div>
</div>