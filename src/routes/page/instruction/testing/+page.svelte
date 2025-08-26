<script>
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import util from "lodash";
	import { Button, Card, CardBody, Col, Row, Tooltip } from '@sveltestrap/sveltestrap';
	import LoadingDots from '$lib/common/LoadingDots.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
    import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import Markdown from '$lib/common/markdown/Markdown.svelte';
	import InstructionState from '../instruction-components/instruction-state.svelte';
	import { getAgents } from '$lib/services/agent-service';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
	import { executeAgentInstruction } from '$lib/services/instruct-service';
	import { getLlmConfigs } from '$lib/services/llm-provider-service';
	import { LlmModelType } from '$lib/helpers/enums';
	import NavBar from '$lib/common/nav-bar/NavBar.svelte';
	import NavItem from '$lib/common/nav-bar/NavItem.svelte';
	import InstructionAgent from '../instruction-components/instruction-agent.svelte';
	import InstructionLlm from '../instruction-components/instruction-llm.svelte';

    const maxLength = 64000;
    const DEFAULT_PROVIDER = 'openai';
    const DEFAULT_MODEL = 'gpt-4o-mini';

    /** @type {any[]}*/
    const tabs = [
        { name: 'instruction-agent', displayText: 'Agent' },
        { name: 'instruction-llm', displayText: 'LLM Config' },
        { name: 'instruction-states', displayText: 'States' }
    ];

    let isLoading = false;
    let isError = false;
    let isThinking = false;
    let requestDone = false;
    
    let text = '';
    let instruction = '';
    let result = '';
    let elapsedTime = '';
    let errorText = 'Please select an agent to proceed!';

    /** @type {import('$agentTypes').AgentModel | null} */
    let selectedAgent = null;

    /** @type {import('$commonTypes').LlmConfig?} */
    let selectedProvider = null;

    /** @type {string | null} */
    let selectedModel = null;

    /** @type {string | null} */
    let selectedTemplate = null;
    
    /** @type {import('$agentTypes').AgentModel[]} */
    let agents = [];

    /** @type {import('$commonTypes').LlmConfig[]} */
    let llmConfigs = [];

    /** @type {any[]} */
    let states = [
        { key: '', value: ''}
    ];

    /** @type {string}*/
    let selectedTab = tabs[0].name;

    onMount(async () => {
        try {
            isLoading = true;
            const pagedAgents = await getAgents({ pager: { page: 1, size: 1000, count: 0 } });
            agents = pagedAgents.items || [];
            llmConfigs = await getLlmConfigs({ type: LlmModelType.Chat });
        } catch {
            agents = [];
        } finally {
            isLoading = false;
        }
    });

    function sendRequest() {
        if (!selectedAgent) {
            isError = true;
            errorText = 'Please select an agent to proceed!';
            setTimeout(() => {
                isError = false;
                errorText = '';
            }, 1500);
            return;
        }

        isThinking = true;
        requestDone = false;
        elapsedTime = '';
        const formattedStates = formatStates(states);
        const start = new Date();
        const agentId = selectedAgent?.id || '';
        executeAgentInstruction(agentId, {
            text: util.trim(text) || '',
            instruction: '#TEMPLATE#',
            provider: selectedProvider?.provider,
            model: selectedModel,
            template: selectedTemplate,
            states: formattedStates
        }).then(res => {
            result = res?.text || '';
        }).finally(() => {
            isThinking = false;
            requestDone = true;
            const gap = new Date().getTime() - start.getTime();
            elapsedTime = `${(gap / 1000).toFixed(3)}s`;
        });
    }

    /** @param {any[]} states */
    function formatStates(states) {
        return states?.filter(x => !!util.trim(x.key) && !!util.trim(x.value)).map(x => {
            return {
                key: util.trim(x.key),
                value: util.trim(x.value)
            };
        }) || [];
    }

    /** @param {KeyboardEvent} e */
	function pressKey(e) {
		if ((e.key === 'Enter' && (!!e.shiftKey || !!e.ctrlKey)) || e.key !== 'Enter' || !!!util.trim(text) || isLoading) {
			return;
		}

		if (e.key === 'Enter') {
			e.preventDefault();
		}

		sendRequest();
	}

    function closeResponse() {
        requestDone = false;
        result = '';
        elapsedTime = ''
    }

    function resetInstruction() {
        instruction = '';
    }

    /** @param {any} e */
    function onAgentSelected(e) {
        selectedAgent = e.detail.agent || null;
        let localText = selectedAgent?.instruction;

        const template = e.detail.template || null;
        selectedTemplate = template?.name || null;
        if (!!template) {
            localText = template?.content;
        }

        instruction = localText || '';
        const providerName = selectedAgent?.llm_config?.provider || null;
        const modelName = selectedAgent?.llm_config?.model || null;
        selectedProvider = llmConfigs?.find(x => x.provider === providerName) || null;
        selectedModel = modelName;
    }
    
    /** @param {any} e */
    function onLlmSelected(e) {
        selectedProvider = e.detail.provider || null;
        selectedModel = e.detail.model || '';
    }

    /** @param {string} selected */
    function handleTabClick(selected) {
        selectedTab = selected;
    }
</script>

<HeadTitle title="{$_('Instruction')}" />
<Breadcrumb pagetitle="{$_('Testing')}" title="{$_('Instruction')}"/>
<LoadingToComplete isLoading={isLoading} isError={isError} errorText={errorText} />

<div class="d-xl-flex">
	<div class="w-100">
        <div class="instruction-container mb-4">
            <textarea
                class='form-control knowledge-textarea'
                rows={8}
                maxlength={maxLength}
                disabled={isThinking}
                placeholder={'Enter input message...'}
                bind:value={text}
                on:keydown={(e) => pressKey(e)}
            />
            <div class="text-secondary text-count" style="display: flex; justify-content: space-between;">
                <div>
                    {#if elapsedTime}
                        {`Elapsed time: ${elapsedTime}`}
                    {/if}
                </div>
                <div>{text?.length || 0}/{maxLength}</div>
            </div>
        
            <div class="mt-2 text-end">
                <Button
                    color="primary"
                    disabled={!text || util.trim(text).length === 0 || isThinking}
                    on:click={() => sendRequest()}
                >
                    {'Send'}
                </Button>
            </div>
        
            {#if isThinking}
                <div class="knowledge-loader mt-4">
                    <LoadingDots duration={'1s'} size={12} gap={5} color={'var(--bs-primary)'} />
                </div>
            {:else if requestDone && !!result}
                <div
                    class="instruction-result-container mt-3"
                    in:fly={{ y: -10, duration: 500 }}
                >
                    <div class="instruct-header text-primary fw-bold">
                        <div>{'Response'}</div>
                        <div>
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <i
                                class="mdi mdi-close-thick text-danger clickable"
                                on:click={() => closeResponse()}
                            />
                        </div>
                    </div>
                    <div class="instruction-result-body instruction-section instruction-border mt-2">
                        <Markdown containerClasses={'markdown-dark text-dark'} text={result} rawText />
                    </div>
                </div>
            {:else if requestDone && !result}
                <div class="mt-3">
                    <h4 class="text-secondary text-center">{"Ehhh, no idea..."}</h4>
                </div>
            {/if}
        </div>
    </div>
</div>

<div class="d-xl-flex mt-4 mb-5">
	<div class="w-100">
        <Row>
            <Col lg="7">
                <div class="instruct-text-header text-primary fw-bold mb-2">
                    <div class="line-align-center">
                        {'Instruction'}
                    </div>
                    <div class="line-align-center">
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <!-- <i
                            class="mdi mdi-refresh text-primary clickable"
                            data-bs-toggle="tooltip"
                            data-bs-placement="bottom"
                            title={'Reset'}
                            on:click={e => resetInstruction()}
                        /> -->
                        <div class="demo-tooltip-icon line-align-center" id="demo-tooltip">
                            <i class="bx bx-info-circle" />
                        </div>
                        <Tooltip target="demo-tooltip" placement="right" class="demo-tooltip-note">
                            <div>Please select an agent to proceed!</div>
                        </Tooltip>
                    </div>
                </div>
            </Col>
            <Col lg="5"></Col>
        </Row>
        <Row class="instruct-setting-container">
            <Col lg="7">
                <div>
                    <div class="instruct-setting-section" style="gap: 2px;">
                        <textarea
                            class='form-control knowledge-textarea'
                            rows={19}
                            maxlength={maxLength}
                            disabled
                            placeholder={''}
                            bind:value={instruction}
                        />
                        <!-- <div class="text-secondary text-end text-count">
                            <div>{instruction?.length || 0}/{maxLength}</div>
                        </div> -->
                    </div>
                </div>
            </Col>
            <Col lg="5" class="instruction-gap">
                <Card>
                    <CardBody>
                        <NavBar
                            id={'instruction-nav-container'}
                            disableDefaultStyles
                            containerClasses={'nav-tabs-secondary'}
                        >
                            {#each tabs as tab, idx}
                            <NavItem
                                containerStyles={`flex: 0 1 calc(100% / ${tabs.length <= 2 ? tabs.length : 3})`}
                                navBtnStyles={'text-transform: none;'}
                                navBtnId={`${tab.name}-tab`}
                                dataBsTarget={`#${tab.name}-tab-pane`}
                                ariaControls={`${tab.name}-tab-pane`}
                                navBtnText={tab.displayText}
                                active={tab.name === selectedTab}
                                onClick={() => handleTabClick(tab.name)}
                            />
                            {/each}
                        </NavBar>
                        
                        <div class:hide={selectedTab !== 'instruction-agent'}>
                            <InstructionAgent
                                agents={agents}
                                disabled={isThinking}
                                on:selectAgent={e => onAgentSelected(e)}
                            />
                        </div>
                        <div class:hide={selectedTab !== 'instruction-llm'}>
                            <InstructionLlm
                                llmConfigs={llmConfigs}
                                disabled={isThinking}
                                selectedProvider={selectedProvider}
                                selectedModel={selectedModel}
                                on:selectLlm={e => onLlmSelected(e)}
                            />
                        </div>
                        <div class:hide={selectedTab !== 'instruction-states'}>
                            <InstructionState
                                bind:states={states}
                                disabled={isThinking}
                            />
                        </div>
                    </CardBody>
                </Card>
                
            </Col>
        </Row>
    </div>
</div>