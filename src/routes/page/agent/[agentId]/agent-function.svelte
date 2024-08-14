<script>
    import { JSONEditor } from 'svelte-jsoneditor';
    import { onMount } from 'svelte';

    /** @type {import('$types').AgentModel} */
    export let agent;

    export const fetchContent = () => {
        return content;
    }

    /** @type {import('svelte-jsoneditor').Content} */
    let content = {
        json: {}
    };

    onMount(() => {
        content = {
            json: {
                functions: agent.functions,
                responses: agent.responses,
                templates: agent.templates
            }
        };
    });

    /**
	 * @param {import('svelte-jsoneditor').Content} updatedContent
	 * @param {import('svelte-jsoneditor').Content} previousContent
     * @param {import('svelte-jsoneditor').OnChangeStatus} status
	 */
    function handleChange(updatedContent, previousContent, status) {
        content = updatedContent;
    }
</script>

<div class="my-json-editor">
    <JSONEditor content={content} onChange={handleChange} />
</div>

<style>
    .my-json-editor {
        /* define a custom theme color */
        --jse-theme-color: var(--bs-primary);
        --jse-theme-color-highlight: #687177;
    }
</style>