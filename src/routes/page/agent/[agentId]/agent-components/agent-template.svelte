<script>
    import { onMount } from 'svelte';
    import { _ } from 'svelte-i18n';
    import { v4 as uuidv4 } from 'uuid';
    import util from "lodash";
    import { Card, CardBody, FormGroup, Input, CardHeader } from '@sveltestrap/sveltestrap';
    import NavBar from '$lib/common/nav-bar/NavBar.svelte';
	import NavItem from '$lib/common/nav-bar/NavItem.svelte';


    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    /** @type {() => void} */
    export let handleAgentChange = () => {};

    export const fetchOriginalTemplates = () => {
        const templates = inner_templates?.map(x => ({
                name: x.name,
                content: x.content
            })) || [];
        return templates;
    };

    export const fetchTemplates = () => {
        const candidates = inner_templates?.filter((x, idx) => !!x.name?.trim())?.map(x => {
            return { name: x.name.trim().toLowerCase(), content: x.content };
        });

        const prompts = [];
        const groups = util.groupBy(candidates, (/** @type {any} */ x) => x.name);
        for (const key in groups) {
            if (groups[key]?.length > 0) {
                prompts.push(groups[key][0]);
            }
        }

        return prompts;
    }

    export const refresh = () => init();


    /** @type {import('$agentTypes').AgentTemplate} */
    const defaultTemplate = {
        uid: '',
        name: '',
        content: ''
    };

    /** @type {import('$agentTypes').AgentTemplate[]} */
    let inner_templates = [];

    /** @type {import('$agentTypes').AgentTemplate} */
    let selected_template = { ...defaultTemplate };

    onMount(() => {
        init();
    });

    function init() {
        inner_templates = [
            ...agent.templates?.map(x => ({
                uid: uuidv4(),
                name: x.name,
                content: x.content
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
</script>


<Card class="agent-prompt-container">
    <CardHeader class="agent-prompt-header border-bottom">
        <div class="d-flex">
            <div class="flex-grow-1">
                <h5 class="fw-semibold">{'Templates'}</h5>
            </div>
        </div>
    </CardHeader>
    <CardBody>
        <FormGroup class="agent-prompt-body">
            <div class="mb-2" style="display: flex; gap: 10px;">
                <div class="line-align-center fw-bold">
                    {'Contents:'}
                </div>
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div
                    class="text-primary clickable"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Add templates"
                    style="font-size: 16px;"
                    on:click={() => addTemplate()}
                >
                    <i class="mdi mdi-plus-circle-outline" />
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
            <Input
                type="textarea"
                class="form-control"
                style="scrollbar-width: thin; resize: none;"
                value={selected_template.content}
                rows={15}
                on:input={(e) => changePrompt(e)}
                placeholder="Enter your content"
            />
            {/if}
        </FormGroup>
    </CardBody>
</Card>