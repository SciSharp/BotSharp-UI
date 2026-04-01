<script>
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import util from "lodash";
	import LoadingDots from '$lib/common/spinners/LoadingDots.svelte';
	import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
    import Breadcrumb from '$lib/common/shared/Breadcrumb.svelte';
	import Markdown from '$lib/common/markdown/Markdown.svelte';
	import { getAgentCodeScripts, getAgents } from '$lib/services/agent-service';
	import LoadingToComplete from '$lib/common/spinners/LoadingToComplete.svelte';
	import { executeAgentInstruction } from '$lib/services/instruct-service';
	import { getLlmConfigs } from '$lib/services/llm-provider-service';
	import { AgentCodeScriptType, LlmModelType } from '$lib/helpers/enums';
	import NavBar from '$lib/common/nav-bar/NavBar.svelte';
	import NavItem from '$lib/common/nav-bar/NavItem.svelte';
	import BotsharpTooltip from '$lib/common/tooltip/BotsharpTooltip.svelte';
	import InstructionAgent from '../instruction-components/instruction-agent.svelte';
	import InstructionLlm from '../instruction-components/instruction-llm.svelte';
    import InstructionState from '../instruction-components/instruction-state.svelte';
    import InstructionCoding from '../instruction-components/instruction-coding.svelte';

    const maxLength = 64000;

    /** @type {any[]}*/
    const tabs = [
        { name: 'instruction-agent', displayText: 'Agent' },
        { name: 'instruction-llm', displayText: 'LLM' },
        { name: 'instruction-states', displayText: 'States' },
        { name: 'instruction-coding', displayText: 'Coding' }
    ];

    let isLoading = $state(false);
    let isError = $state(false);
    let isThinking = $state(false);
    let requestDone = $state(false);

    let text = $state('');
    let instruction = $state('');
    let result = $state('');
    let elapsedTime = $state('');
    let errorText = $state('Please select an agent to proceed!');

    /** @type {import('$agentTypes').AgentModel | null} */
    let selectedAgent = $state(null);

    /** @type {import('$commonTypes').LlmConfig | null} */
    let selectedProvider = $state(null);

    /** @type {string | null} */
    let selectedModel = $state(null);

    /** @type {string | null} */
    let selectedTemplate = $state(null);

    /** @type {import('$agentTypes').AgentCodeScriptViewModel | null | undefined} */
    let selectedCodeScript = $state(null);

    /** @type {import('$agentTypes').AgentModel[]} */
    let agents = $state([]);

    /** @type {import('$commonTypes').LlmConfig[]} */
    let llmConfigs = $state([]);

    /** @type {import('$agentTypes').AgentCodeScriptViewModel[]} */
    let codeScripts = $state([]);

    /** @type {import('$commonTypes').KeyValuePair[]} */
    let states = $state([{ key: '', value: ''}]);

    /** @type {import('$commonTypes').KeyValuePair[]} */
    let args = $state([{ key: '', value: ''}]);

    /** @type {string}*/
    let selectedTab = $state(tabs[0].name);

    onMount(async () => {
        try {
            isLoading = true;
            const pagedAgents = await getAgents({ pager: { page: 1, size: 1000, count: 0 } });
            agents = pagedAgents.items || [];
            llmConfigs = await getLlmConfigs({ modelTypes: [LlmModelType.Chat] });
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
        const formattedStates = formatKeyValues(states);
        const formatedArgs = formatKeyValues(args);
        const start = new Date();
        const agentId = selectedAgent?.id || '';
        executeAgentInstruction(agentId, {
            text: util.trim(text) || '',
            instruction: '#TEMPLATE#',
            provider: selectedProvider?.provider,
            model: selectedModel,
            template: selectedTemplate,
            states: formattedStates,
            codeOptions: {
                script_name: selectedCodeScript?.name,
                arguments: formatedArgs
            }
        }).then(res => {
            result = res?.text || '';
        }).finally(() => {
            isThinking = false;
            requestDone = true;
            const gap = new Date().getTime() - start.getTime();
            elapsedTime = `${(gap / 1000).toFixed(3)}s`;
        });
    }

    /** @param {import('$commonTypes').KeyValuePair[]} kvs */
    function formatKeyValues(kvs) {
        return kvs?.filter(x => !!util.trim(x.key) && !!util.trim(x.value)).map(x => {
            return {
                key: util.trim(x.key),
                value: util.trim(x.value)
            };
        }) || [];
    }

    /** @param {KeyboardEvent} e */
	function pressKey(e) {
		if ((e.key === 'Enter' && (!!e.shiftKey || !!e.ctrlKey)) || e.key !== 'Enter' || !util.trim(text) || isLoading) {
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

    /** @param {{ agent: import('$agentTypes').AgentModel | null, template: any }} detail */
    function onAgentSelected(detail) {
        selectedAgent = detail.agent || null;
        let localText = selectedAgent?.instruction;

        const template = detail.template || null;
        selectedTemplate = template?.name || null;
        if (template) {
            localText = template?.content;
        }

        instruction = localText || '';
        const providerName = selectedAgent?.llm_config?.provider || null;
        const modelName = selectedAgent?.llm_config?.model || null;
        selectedProvider = llmConfigs?.find(x => x.provider === providerName) || null;
        selectedModel = modelName;

        if (selectedAgent?.id) {
            initAgentCodeScripts(selectedAgent.id);
        } else {
            codeScripts = [];
        }
    }

    /** @param {{ provider: import('$commonTypes').LlmConfig | null, model: string | null }} detail */
    function onLlmSelected(detail) {
        selectedProvider = detail.provider || null;
        selectedModel = detail.model || '';
    }

    /** @param {string} agentId */
    function initAgentCodeScripts(agentId) {
        return new Promise((resolve, reject) => {
            getAgentCodeScripts(agentId, { scriptTypes: [AgentCodeScriptType.Src] }).then(res => {
                codeScripts = res || [];
                resolve(res);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    /** @param {string} selected */
    function handleTabClick(selected) {
        selectedTab = selected;
    }
</script>

<HeadTitle title={$_('Instruction')} />
<Breadcrumb pagetitle={$_('Testing')} title={$_('Instruction')}/>

<LoadingToComplete
    isLoading={isLoading}
    isError={isError}
    errorText={errorText}
/>

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
                onkeydown={(e) => pressKey(e)}
            ></textarea>
            <div class="text-secondary text-count d-flex justify-content-between">
                <div>
                    {#if elapsedTime}
                        {`Elapsed time: ${elapsedTime}`}
                    {/if}
                </div>
                <div>{text?.length || 0}/{maxLength}</div>
            </div>

            <div class="mt-2 text-end">
                <button
                    type="button"
                    class="btn btn-primary"
                    disabled={!text || util.trim(text).length === 0 || isThinking}
                    onclick={() => sendRequest()}
                >
                    {'Send'}
                </button>
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
                            <i
                                class="mdi mdi-close-thick text-danger clickable"
                                role="button"
                                tabindex="0"
                                onclick={() => closeResponse()}
                                onkeydown={(/** @type {KeyboardEvent} */ e) => { if (e.key === 'Enter') closeResponse(); }}
                            ></i>
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
        <div class="row">
            <div class="col-lg-7">
                <div class="instruct-text-header text-primary fw-bold mb-2">
                    <div class="line-align-center">
                        {'Instruction'}
                    </div>
                    <div class="line-align-center">
                        <div class="demo-tooltip-icon line-align-center" id="demo-tooltip">
                            <i class="bx bx-info-circle"></i>
                        </div>
                        <BotsharpTooltip target="demo-tooltip" placement="right" containerClasses="demo-tooltip-note">
                            <div>Please select an agent to proceed!</div>
                        </BotsharpTooltip>
                    </div>
                </div>
            </div>
            <div class="col-lg-5"></div>
        </div>
        <div class="row instruct-setting-container">
            <div class="col-lg-7">
                <div>
                    <div class="instruct-setting-section" style="gap: 2px;">
                        <textarea
                            class='form-control knowledge-textarea'
                            rows={19}
                            maxlength={maxLength}
                            disabled
                            placeholder={''}
                            bind:value={instruction}
                        ></textarea>
                    </div>
                </div>
            </div>
            <div class="col-lg-5 instruction-gap">
                <div class="card">
                    <div class="card-body">
                        <NavBar
                            id={'instruction-nav-container'}
                            disableDefaultStyles
                            containerClasses={'nav-tabs-secondary'}
                        >
                            {#each tabs as tab}
                            <NavItem
                                containerStyles={`flex: 0 1 calc(100% / ${tabs.length <= 3 ? tabs.length : 4})`}
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
                                onSelectAgent={detail => onAgentSelected(detail)}
                            />
                        </div>
                        <div class:hide={selectedTab !== 'instruction-llm'}>
                            <InstructionLlm
                                llmConfigs={llmConfigs}
                                disabled={isThinking}
                                bind:selectedProvider={selectedProvider}
                                bind:selectedModel={selectedModel}
                                onSelectLlm={detail => onLlmSelected(detail)}
                            />
                        </div>
                        <div class:hide={selectedTab !== 'instruction-states'}>
                            <InstructionState
                                bind:states={states}
                                disabled={isThinking}
                            />
                        </div>
                        <div class:hide={selectedTab !== 'instruction-coding'}>
                            <InstructionCoding
                                bind:selectedCodeScript={selectedCodeScript}
                                bind:args={args}
                                codeScripts={codeScripts}
                                disabled={isThinking}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>