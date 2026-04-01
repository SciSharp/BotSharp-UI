<script>
    import Select from '$lib/common/dropdowns/Select.svelte';

    /**
     * @type {{
     *   agents?: import('$agentTypes').AgentModel[],
     *   disabled?: boolean,
     *   onSelectAgent?: (detail: { agent: import('$agentTypes').AgentModel | null, template: any }) => void
     * }}
     */
    let {
        agents = [],
        disabled = false,
        onSelectAgent
    } = $props();

    /** @type {import('$commonTypes').LabelValuePair[]} */
    let agentOptions = $state([]);
    /** @type {any[]} */
    let templateOptions = $state([]);

    /** @type {import('$agentTypes').AgentModel | null | undefined} */
    let selectedAgent = $state(null);
    /** @type {any} */
    let selectedTemplate = $state(null);

    $effect(() => {
        agentOptions = agents?.map(x => ({
            label: x.name,
            value: x.id
        }))?.sort((a, b) => a.label.localeCompare(b.label)) || [];
        templateOptions = [];
        selectedAgent = null;
        selectedTemplate = null;
    });

    /** @param {any} e */
    function selectAgent(e) {
        // @ts-ignore
		const selectedValues = e.detail.selecteds?.map(x => x.value) || [];
        selectedTemplate = null;
        selectedAgent = selectedValues.length > 0 ? agents?.find(x => x.id === selectedValues[0]) : null;
        templateOptions = selectedAgent?.templates?.map(x => ({
            id: x.name,
            name: x.name,
            label: x.name,
            value: x.name,
            content: x.content
        })) || [];

        fireSelectAgent();
    }

    /** @param {any} e */
    function selectTemplate(e) {
        // @ts-ignore
		const selectedValues = e.detail.selecteds?.map(x => x.value) || [];
        selectedTemplate = selectedValues.length > 0 ? templateOptions.find(x => x.value === selectedValues[0]) : null;
        fireSelectAgent();
    }

    function fireSelectAgent() {
        onSelectAgent?.({
            agent: selectedAgent || null,
            template: selectedTemplate || null
        });
    }
</script>


<div class="instruct-setting-section instruct-setting-padding">
    <div class="instruct-setting-item">
        <div class="instruct-setting-dropdown">
            <div class="text-primary fw-bold mb-1">Agent</div>
            <Select
                tag={'agent-select'}
                placeholder={'Select Agent'}
                searchMode
                disabled={disabled}
                selectedValues={selectedAgent?.id ? [selectedAgent.id] : []}
                options={agentOptions}
                onselect={e => selectAgent(e)}
            />
        </div>
    </div>

    <div class="instruct-setting-item">
        <div class="instruct-setting-dropdown">
            <div class="text-primary fw-bold mb-1">Template</div>
            <Select
                tag={'template-select'}
                placeholder={'Select Template'}
                searchMode
                disabled={disabled}
                selectedValues={selectedTemplate?.id ? [selectedTemplate.id] : []}
                options={templateOptions}
                onselect={e => selectTemplate(e)}
            />
        </div>
    </div>
</div>