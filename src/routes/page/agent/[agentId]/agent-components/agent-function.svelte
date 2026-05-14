<script>
    import { onMount } from 'svelte';
    import { JSONEditor, Mode } from 'svelte-jsoneditor';

    /**
     * @type {{
     *   agent: import('$agentTypes').AgentModel,
     *   handleAgentChange?: () => void
     * }}
     */
    let {
        agent = $bindable(),
        handleAgentChange = () => {}
    } = $props();

    export function fetchContent() {
        return content;
    }

    export function refresh() {
        init();
    }

    /** @type {import('svelte-jsoneditor').Content} */
    let content = $state({
        json: {}
    });

    onMount(() => {
        init();
    });

    function init() {
        content = {
            json: {
                functions: agent.functions,
                responses: agent.responses
            }
        };
    }

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

<div class="af-json-editor">
    <JSONEditor mode={Mode.table} content={content} onChange={handleChange} />
</div>

<style>
    .af-json-editor {
        /* define a custom theme color */
        --jse-theme-color: var(--color-primary);
        --jse-theme-color-highlight: #687177;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.625rem;
        overflow: hidden;
        background-color: rgb(255 255 255);
    }
    :global(.dark) .af-json-editor {
        border-color: rgb(55 65 81);
    }
</style>