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