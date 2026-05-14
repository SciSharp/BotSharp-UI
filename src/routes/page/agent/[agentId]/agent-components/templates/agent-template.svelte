<script>
    import { onMount } from 'svelte';
    import { v4 as uuidv4 } from 'uuid';
    import NavBar from '$lib/common/nav-bar/NavBar.svelte';
    import NavItem from '$lib/common/nav-bar/NavItem.svelte';
    import AgentTemplateConfig from './agent-template-config.svelte';

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

    export function fetchTemplates() {
        // Remove templates with empty names
        const withNames = inner_templates.filter(x => !!x.name?.trim());

        // Remove duplicates by name (keep first occurrence)
        /** @type {Set<string>} */
        const seen = new Set();
        const unique = withNames.filter(x => {
            const key = x.name.trim().toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // Update inner state to reflect cleanup
        inner_templates = unique;
        if (!unique.find(x => x.uid === selected_template.uid)) {
            selected_template = unique.length > 0 ? unique[0] : { ...defaultTemplate };
        }

        return unique.map(x => {
            const llmConfig = x.llm_config ? {
                ...x.llm_config,
                max_output_tokens: Number(x.llm_config.max_output_tokens) > 0 ? Number(x.llm_config.max_output_tokens) : null
            } : null;

            return {
                name: x.name.trim().toLowerCase(),
                content: x.content,
                response_format: x.response_format || null,
                llm_config: llmConfig
            };
        });
    }


    /** @type {import('$agentTypes').AgentTemplate} */
    const defaultTemplate = {
        uid: '',
        name: '',
        content: ''
    };

    /** @type {import('$agentTypes').AgentTemplate[]} */
    let inner_templates = $state([]);

    /** @type {import('$agentTypes').AgentTemplate} */
    let selected_template = $state({ ...defaultTemplate });

    /** @type {boolean} */
    let showConfig = $state(false);

    onMount(() => {
        init();
    });

    function init() {
        inner_templates = [
            ...agent.templates?.map(x => ({
                uid: uuidv4(),
                name: x.name,
                content: x.content,
                response_format: x.response_format || null,
                llm_config: x.llm_config || null
            })) || []
        ];

        selected_template = inner_templates.length > 0 ? inner_templates[0] : {
            ...defaultTemplate
        };
    }


    /** @param {string | undefined | null} uid */
    function selectTemplate(uid) {
        if (uid === selected_template.uid) {
            return;
        }

        selected_template = inner_templates.find(x => x.uid === uid) || { ...defaultTemplate };
    }

    /** @param {any} e */
    function changePrompt(e) {
        e.preventDefault();
        const value = e.target.value;
        selected_template.content = value || '';
        handleAgentChange();
    }

    /** @param {any} e */
    function onKeyDown(e) {
        if (e.key === 'Tab') {
            e.preventDefault();

            if (e.target) {
                const start = e.target.selectionStart || 0;
                const end = e.target.selectionEnd || 0;
                const value = e.target.value || '';
                e.target.value = value.substring(0, start) + "\t" + value.substring(end);
                e.target.selectionStart = start + 1;
                e.target.selectionEnd = start + 1;
            }
        }
    }

    function addTemplate() {
        inner_templates = [
            ...inner_templates,
            {
                uid: uuidv4(),
                name: '',
                content: ''
            }
        ];

        selected_template = inner_templates[inner_templates.length-1];
        handleAgentChange();
    }

    /** @param {string | undefined | null} uid */
    function deleteTemplate(uid) {
        inner_templates = inner_templates.filter(x => x.uid !== uid);
        if (selected_template.uid === uid) {
            selected_template = inner_templates.length > 0 ? inner_templates[0] : {
                ...defaultTemplate
            };
        }
        handleAgentChange();
    }

    function toggleConfig() {
        showConfig = !showConfig;
    }
</script>


<div class="tpl-card">
    <div class="tpl-card-header">
        <h5 class="tpl-title">{'Templates'}</h5>
    </div>
    <div class="tpl-card-body">
        <div class="tpl-section">
            <div class="tpl-section-header">
                <div class="tpl-section-label">
                    {'Contents:'}
                </div>
                <div
                    class="tpl-add-btn"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Add templates"
                    role="button"
                    tabindex="0"
                    onclick={() => addTemplate()}
                    onkeydown={(e) => e.key === 'Enter' && addTemplate()}
                >
                    <i class="mdi mdi-plus-circle-outline"></i>
                </div>
            </div>

            {#if inner_templates.length > 0}
            <NavBar
                id={'agent-template-container'}
                disableDefaultStyles
                containerClasses={'nav-tabs-secondary'}
            >
                {#each inner_templates as template, idx (idx) }
                <NavItem
                    containerStyles={`flex: 0 1 calc(100% / ${inner_templates.length <= 2 ? inner_templates.length : 3})`}
                    navBtnStyles={'text-transform: none;'}
                    navBtnId={`template-${idx}-prompt-tab`}
                    dataBsTarget={`#template-${idx}-prompt-tab-pane`}
                    ariaControls={`template-${idx}-prompt-tab-pane`}
                    bind:navBtnText={template.name}
                    active={template.uid === selected_template.uid}
                    allowEdit
                    allowDelete
                    maxEditLength={50}
                    editPlaceholder={'Type a title here...'}
                    onClick={() => selectTemplate(template.uid)}
                    onDelete={() => deleteTemplate(template.uid)}
                    onInput={() => handleAgentChange()}
                />
                {/each}
            </NavBar>

            <div class="tpl-content-wrapper">
                <div class="tpl-editor-area">
                    <textarea
                        class="tpl-textarea"
                        placeholder="Enter your content"
                        value={selected_template.content}
                        oninput={(e) => changePrompt(e)}
                        onkeydown={(e) => onKeyDown(e)}
                    ></textarea>
                </div>

                <!-- Config toggle button -->
                <div
                    class="tpl-config-toggle"
                    role="button"
                    tabindex="0"
                    title={showConfig ? 'Hide config' : 'Show config'}
                    onclick={() => toggleConfig()}
                    onkeydown={(e) => e.key === 'Enter' && toggleConfig()}
                >
                    <i class="mdi {showConfig ? 'mdi-chevron-right' : 'mdi-chevron-left'}"></i>
                </div>

                <!-- Config panel -->
                <div class="tpl-config-panel" class:expanded={showConfig}>
                    {#if showConfig}
                        <AgentTemplateConfig
                            bind:template={selected_template}
                            {handleAgentChange}
                        />
                    {/if}
                </div>
            </div>
            {/if}
        </div>
    </div>
</div>


<style>
    /* ===== Card shell ===== */
    .tpl-card {
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.625rem;
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.04),
            0 6px 16px -10px rgb(15 23 42 / 0.08);
        overflow: hidden;
    }
    .tpl-card-header {
        padding: 0.9375rem 1.25rem;
        background-color: rgb(255 255 255);
        border-bottom: 1px solid rgb(229 231 235);
    }
    .tpl-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: rgb(55 65 81);
    }
    .tpl-card-body {
        padding: 1.25rem;
        overflow-y: auto;
        scrollbar-width: none;
    }

    /* ===== Section ===== */
    .tpl-section {
        margin-bottom: 0;
    }
    .tpl-section-header {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        margin-bottom: 0.5rem;
    }
    .tpl-section-label {
        display: inline-flex;
        align-items: center;
        font-weight: 700;
        font-size: 0.875rem;
        color: rgb(55 65 81);
    }

    /* ===== Add template button ===== */
    .tpl-add-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--color-primary);
        cursor: pointer;
        line-height: 1;
        transition: color 0.15s ease, transform 0.15s ease;
    }
    .tpl-add-btn:hover {
        color: var(--color-primary-hover);
        transform: scale(1.1);
    }
    .tpl-add-btn i {
        font-size: 1.25rem;
        line-height: 1;
    }

    /* ===== Editor + config side-by-side wrapper ===== */
    .tpl-content-wrapper {
        display: flex;
        flex-direction: row;
        gap: 0;
        position: relative;
        align-items: stretch;
        height: 380px;
    }
    .tpl-editor-area {
        flex: 1;
        min-width: 0;
        display: flex;
    }
    .tpl-textarea {
        flex: 1;
        width: 100%;
        padding: 0.625rem 0.75rem;
        border: 1px solid rgb(229 231 235);
        border-radius: 0.5rem;
        background-color: rgb(249 250 251);
        font-size: 0.875rem;
        line-height: 1.5;
        color: rgb(17 24 39);
        resize: none;
        scrollbar-width: thin;
        font-family: inherit;
        transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
    }
    .tpl-textarea::placeholder {
        color: var(--color-muted);
    }
    .tpl-textarea:focus {
        outline: 0;
        border-color: var(--color-primary);
        background-color: rgb(255 255 255);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }

    /* ===== Config toggle ===== */
    .tpl-config-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        cursor: pointer;
        color: var(--color-primary);
        font-size: 1.125rem;
        user-select: none;
        flex-shrink: 0;
        opacity: 0.7;
        transition: opacity 0.2s ease;
    }
    .tpl-config-toggle:hover {
        opacity: 1;
    }
    .tpl-config-toggle:focus {
        outline: none;
    }

    /* ===== Config panel ===== */
    .tpl-config-panel {
        width: 0;
        overflow: hidden;
        transition: width 0.3s ease;
        border-left: none;
        flex-shrink: 0;
    }
    .tpl-config-panel.expanded {
        width: 260px;
        border-left: 1px solid rgb(229 231 235);
        overflow-y: auto;
        scrollbar-width: thin;
    }

    /* ===== Responsive ===== */
    @media (max-width: 768px) {
        .tpl-content-wrapper {
            flex-direction: column;
            height: auto;
        }
        .tpl-config-toggle {
            width: 100%;
            height: 24px;
            flex-direction: row;
        }
        .tpl-config-toggle :global(.mdi) {
            transform: rotate(90deg);
        }
        .tpl-config-panel {
            width: 100% !important;
            height: 0;
            transition: height 0.3s ease;
            border-left: none;
        }
        .tpl-config-panel.expanded {
            width: 100% !important;
            height: auto;
            border-left: none;
            border-top: 1px solid rgb(229 231 235);
        }
    }

    /* ===== Dark mode ===== */
    :global(.dark) .tpl-card,
    :global(.dark) .tpl-card-header {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .tpl-title,
    :global(.dark) .tpl-section-label {
        color: rgb(229 231 235);
    }
    :global(.dark) .tpl-textarea {
        background-color: rgb(17 24 39);
        border-color: rgb(55 65 81);
        color: rgb(229 231 235);
    }
    :global(.dark) .tpl-config-panel.expanded {
        border-color: rgb(55 65 81);
    }
</style>
