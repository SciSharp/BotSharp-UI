<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { fly } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import { Col, Row, Button } from '@sveltestrap/sveltestrap';


    const svelteDispatch = createEventDispatcher();

    const DEFAULT_PROVIDER = 'openai';
    const DEFAULT_MODEL = 'gpt-4o-mini';

    /** @type {import('$agentTypes').AgentModel[]} */
    export let agents = [];

    /** @type {import('$commonTypes').LlmConfig[]} */
    export let llmConfigs = [];

    /** @type {boolean} */
    export let disabled = false;

    /** @type {boolean} */
    let showSetting = true;

    /** @type {any[]} */
    let agentOptions = [];
    /** @type {any[]} */
    let templateOptions = [];
    /** @type {any[]} */
    let providerOptions = [];
    /** @type {any[]} */
    let modelOptions = [];

    /** @type {import('$agentTypes').AgentModel?} */
    let selectedAgent = null;
    /** @type {any} */
    let selectedTemplate = null;
    /** @type {import('$commonTypes').LlmConfig?} */
    let selectedProvider = null;
    /** @type {any} */
    let selectedModel = null;

    $: {
        collectAgentOptions(agents);
        collectLlmOptions(llmConfigs);
    }

    /**
	 * @param {import('$agentTypes').AgentModel[]} agents
	 */
    function collectAgentOptions(agents) {
        agentOptions = agents?.map(x => ({
            id: x.id,
            name: x.name
        }))?.sort((a, b) => a.name.localeCompare(b.name)) || [];
    }

    /** @param {import('$commonTypes').LlmConfig[]} llmConfigs */
    function collectLlmOptions(llmConfigs) {
        providerOptions = llmConfigs?.map(x => ({
            id: x.provider,
            name: x.provider
        }))?.sort((a, b) => a.name.localeCompare(b.name)) || [];
    }

    /** @param {any} e */
    function selectAgent(e) {
        const selected = e.target.value || null;
        selectedTemplate = null;
        selectedAgent = agents?.find(x => x.id === selected) || null;
        templateOptions = selectedAgent?.templates?.map(x => ({
            id: x.name,
            name: x.name,
            content: x.content
        })) || [];

        const provider = selectedAgent?.llm_config?.provider || DEFAULT_PROVIDER;
        const model = selectedAgent?.llm_config?.model || DEFAULT_MODEL;
        selectedProvider = llmConfigs?.find(x => x.provider === provider) || null;
        onProviderChanged(model);

        svelteDispatch('agentSelected', {
            selectedAgent: selectedAgent,
            selectedTemplate: selectedTemplate,
            selectedProvider: selectedProvider?.provider,
            selectedModel: selectedModel?.name
        });
    }

    /** @param {any} e */
    function selectTemplate(e) {
        const selected = e.target.value || null;
        selectedTemplate = templateOptions.find(x => x.id === selected) || null;
        svelteDispatch('agentSelected', {
            selectedAgent: selectedAgent,
            selectedTemplate: selectedTemplate,
            selectedProvider: selectedProvider?.provider,
            selectedModel: selectedModel?.name
        });
    }

    /** @param {any} e */
    function selectProvider(e) {
        const selected = e.target.value || null;
        selectedProvider = llmConfigs?.find(x => x.provider === selected) || null;
        onProviderChanged();

        svelteDispatch('llmSelected', {
            selectedProvider: selectedProvider?.provider,
            selectedModel: selectedModel?.name
        });
    }

    /** @param {any} e */
    function selectModel(e) {
        const selected = e.target.value || null;
        selectedModel = modelOptions.find(x => x.id === selected);

        svelteDispatch('llmSelected', {
            selectedProvider: selectedProvider?.provider,
            selectedModel: selectedModel?.name
        });
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
</script>

<div class="instruct-header text-primary fw-bold mb-2">
    <div class="line-align-center">
        {#if showSetting}
            {'Settings'}
        {/if}
    </div>
    <div>
        <Button
            color={showSetting ? 'secondary' : 'info'}
            data-bs-toggle="tooltip"
            data-bs-placement="bottom"
            title={`${showSetting ? 'Close' : 'Open'} Settings`}
            on:click={() => showSetting = !showSetting}
        >
            <div class="state-search-btn">
                <div>
                    {#if showSetting}
                        <i class="bx bx-hide" />
                    {:else}
                        <i class="bx bx-cog" />
                    {/if}
                </div>
            </div>
        </Button>	
    </div>
</div>

{#if showSetting}
<div
    in:fly={{ y: -10, duration: 500 }}
    out:fly={{ y: -10, duration: 200 }}
>
    <Row class="instruct-setting-container">
        <Col lg="6">
            <div class="instruct-setting-section instruction-border instruct-setting-padding">
                <div class="instruct-setting-item">
                    <div class="instruct-setting-dropdown">
                        <div class="text-primary fw-bold mb-1">Agent</div>
                        <select class="form-select" id="agent" value={selectedAgent?.id || null} disabled={disabled} on:change={e => selectAgent(e)}>
                            <option value={null}>{$_('Select Agent')}</option>
                            {#each agentOptions as op}
                                <option value={`${op.id}`} selected={op.id === selectedAgent?.id}>{$_(`${op.name}`)}</option>
                            {/each}
                        </select>
                    </div>
                </div>
    
                <div class="instruct-setting-item">
                    <div class="instruct-setting-dropdown">
                        <div class="text-primary fw-bold mb-1">Template</div>
                        <select class="form-select" id="template" value={selectedTemplate?.id || null} disabled={disabled} on:change={e => selectTemplate(e)}>
                            <option value={null}>{$_('Select Template')}</option>
                            {#each templateOptions as op}
                                <option value={`${op.id}`} selected={op.id === selectedTemplate?.id}>{$_(`${op.name}`)}</option>
                            {/each}
                        </select>
                    </div>
                </div>
            </div>
        </Col>
    
        <Col lg="6">
            <div class="instruct-setting-section instruction-border instruct-setting-padding">
                <div class="instruct-setting-item">
                    <div class="instruct-setting-dropdown">
                        <div class="text-primary fw-bold mb-1">LLM Provider</div>
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
                        <div class="text-primary fw-bold mb-1">LLM Model</div>
                        <select class="form-select" id="model" value={selectedModel?.id || null} disabled={disabled} on:change={e => selectModel(e)}>
                            <option value={null} disabled selected>{$_('Select Model')}</option>
                            {#each modelOptions as op}
                                <option value={`${op.id}`} selected={op.id === selectedModel?.id}>{$_(`${op.name}`)}</option>
                            {/each}
                        </select>
                    </div>
                </div>
            </div>
        </Col>
    </Row>
</div>
{/if}