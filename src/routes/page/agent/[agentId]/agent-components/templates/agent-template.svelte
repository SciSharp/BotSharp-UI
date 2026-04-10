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

        return unique.map(x => ({
            name: x.name.trim().toLowerCase(),
            content: x.content,
            response_format: x.response_format || null,
            llm_config: x.llm_config || null
        }));
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


<div class="card agent-prompt-container">
    <div class="card-header agent-prompt-header border-bottom">
        <div class="d-flex">
            <div class="flex-grow-1">
                <h5 class="fw-semibold">{'Templates'}</h5>
            </div>
        </div>
    </div>
    <div class="card-body">
        <div class="agent-prompt-body">
            <div class="mb-2" style="display: flex; gap: 10px;">
                <div class="line-align-center fw-bold">
                    {'Contents:'}
                </div>
                <div
                    class="text-primary clickable"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Add templates"
                    style="font-size: 16px;"
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

            <div class="template-content-wrapper">
                <div class="template-editor-area">
                    <textarea
                        class="form-control template-textarea"
                        placeholder="Enter your content"
                        value={selected_template.content}
                        oninput={(e) => changePrompt(e)}
                        onkeydown={(e) => onKeyDown(e)}
                    ></textarea>
                </div>

                <!-- Config toggle button -->
                <div
                    class="config-toggle-btn"
                    role="button"
                    tabindex="0"
                    title={showConfig ? 'Hide config' : 'Show config'}
                    onclick={() => toggleConfig()}
                    onkeydown={(e) => e.key === 'Enter' && toggleConfig()}
                >
                    <i class="mdi {showConfig ? 'mdi-chevron-right' : 'mdi-chevron-left'}"></i>
                </div>

                <!-- Config panel -->
                <div class="template-config-panel" class:expanded={showConfig}>
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
