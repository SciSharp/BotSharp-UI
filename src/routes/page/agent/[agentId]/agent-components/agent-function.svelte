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
        position: relative;
        background:
            linear-gradient(
                180deg,
                rgb(255 255 255),
                color-mix(in srgb, var(--color-primary) 1.5%, rgb(255 255 255))
            );
        border: 1px solid color-mix(in srgb, var(--color-primary) 8%, rgb(229 231 235));
        border-radius: 0.875rem;
        box-shadow:
            0 1px 0 rgb(255 255 255 / 0.7) inset,
            0 1px 2px rgb(15 23 42 / 0.04),
            0 10px 28px -16px color-mix(in srgb, var(--color-primary) 35%, rgb(15 23 42 / 0.12));
        overflow: hidden;
    }
    :global(.dark) .af-json-editor {
        background:
            linear-gradient(
                180deg,
                rgb(31 41 55),
                color-mix(in srgb, var(--color-primary) 6%, rgb(31 41 55))
            );
        border-color: color-mix(in srgb, var(--color-primary) 14%, rgb(55 65 81));
        box-shadow:
            0 1px 0 rgb(255 255 255 / 0.04) inset,
            0 1px 2px rgb(0 0 0 / 0.2),
            0 10px 28px -16px color-mix(in srgb, var(--color-primary) 45%, rgb(0 0 0 / 0.4));
    }
</style>