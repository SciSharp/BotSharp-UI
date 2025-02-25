<script>
    import { createEventDispatcher, onMount } from 'svelte';
	import { _ } from 'svelte-i18n';

    const svelteDispatch = createEventDispatcher();

    /** @type {import('$agentTypes').AgentModel[]} */
    export let agents = [];

    /** @type {boolean} */
    export let disabled = false;

    /** @type {any[]} */
    let agentOptions = [];
    /** @type {any[]} */
    let templateOptions = [];

    /** @type {import('$agentTypes').AgentModel?} */
    let selectedAgent = null;
    /** @type {any} */
    let selectedTemplate = null;

    $: {
        collectAgentOptions(agents);
    }

    /**
	 * @param {import('$agentTypes').AgentModel[]} agents
	 */
    function collectAgentOptions(agents) {
        agentOptions = agents?.filter(x => x.templates?.length > 0).map(x => ({
            id: x.id,
            name: x.name
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

        disPatchEvent();
    }

    /** @param {any} e */
    function selectTemplate(e) {
        const selected = e.target.value || null;
        selectedTemplate = templateOptions.find(x => x.id === selected) || null;
        disPatchEvent();
    }

    function disPatchEvent() {
        svelteDispatch('agentSelected', {
            agent: selectedAgent,
            template: selectedTemplate
        });
    }
</script>


<div class="instruct-setting-section instruct-setting-padding">
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