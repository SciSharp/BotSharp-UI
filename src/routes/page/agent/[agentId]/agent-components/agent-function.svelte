<script>
    import { JSONEditor, Mode } from 'svelte-jsoneditor';
    import { onMount } from 'svelte';

    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    /** @type {() => void} */
    export let handleAgentChange;

    export const fetchContent = () => {
        return content;
    }

    /** @type {import('svelte-jsoneditor').Content} */
    let content = {
        json: {}
    };

    onMount(() => {
        init();
    });

    function init() {
        content = {
            json: {
                functions: agent.functions,
                responses: agent.responses,
                templates: agent.templates
            }
        };
    }

    export const reinit = () => init();

    /**
	 * @param {import('svelte-jsoneditor').Content} updatedContent
	 * @param {import('svelte-jsoneditor').Content} previousContent
     * @param {import('svelte-jsoneditor').OnChangeStatus} status
	 */
    function handleChange(updatedContent, previousContent, status) {
        content = updatedContent;
        const isInitial = 'json' in previousContent && JSON.stringify(previousContent.json) === "{}";
        !isInitial && handleAgentChange();
    }
</script>

<div class="my-json-editor">
    <JSONEditor mode={Mode.table} content={content} onChange={handleChange} />
</div>

<style>
    .my-json-editor {
        /* define a custom theme color */
        --jse-theme-color: var(--bs-primary);
        --jse-theme-color-highlight: #687177;
    }
</style>