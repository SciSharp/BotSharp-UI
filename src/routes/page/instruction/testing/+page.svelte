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
	import { formatNumber } from '$lib/helpers/utils/common';

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
    let selectedReasoningEffortLevel = $state(null);

    /** @type {number | null} */
    let selectedMaxOutputTokens = $state(null);

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
        const clonedStates = [
            { key: 'reasoning_effort_level', value: selectedReasoningEffortLevel ? selectedReasoningEffortLevel : 'disable' }
        ];
        if (selectedMaxOutputTokens && selectedMaxOutputTokens > 0) {
            clonedStates.push({ key: 'max_tokens', value: selectedMaxOutputTokens.toString() });
        }

        const formattedStates = formatKeyValues(states, clonedStates);
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
            codeOptions: selectedCodeScript?.name ? {
                script_name: selectedCodeScript?.name,
                arguments: formatedArgs
            } : null
        }).then(res => {
            result = res?.text || '';
        }).finally(() => {
            isThinking = false;
            requestDone = true;
            const gap = new Date().getTime() - start.getTime();
            elapsedTime = `${(gap / 1000).toFixed(3)}s`;
        });
    }

    /**
     * @param {import('$commonTypes').KeyValuePair[]} kvs
     * @param {import('$commonTypes').KeyValuePair[]} [defaults]
     */
    function formatKeyValues(kvs, defaults) {
        const primary = kvs || [];
        const primaryKeys = new Set(primary.map(x => util.trim(x.key)).filter(k => !!k));
        const merged = [...(defaults || []).filter(x => !primaryKeys.has(util.trim(x.key))), ...primary];
        return merged.filter(x => !!util.trim(x.key) && !!util.trim(x.value)).map(x => {
            return {
                key: util.trim(x.key),
                value: util.trim(x.value)
            };
        });
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

    /** @param {{ agent: import('$agentTypes').AgentModel | null, template: any, llmConfig: any }} detail */
    function onAgentSelected(detail) {
        selectedAgent = detail.agent || null;
        let localText = selectedAgent?.instruction;

        const template = detail.template || null;
        selectedTemplate = template?.name || null;
        if (template) {
            localText = template?.content;
        }

        instruction = localText || '';
        const llmConfig = detail?.llmConfig || null;
        const providerName = llmConfig?.provider || null;
        const modelName = llmConfig?.model || null;
        selectedProvider = llmConfigs?.find(x => x.provider === providerName) || null;
        selectedModel = modelName;
        selectedReasoningEffortLevel = llmConfig?.reasoning_effort_level || null;
        selectedMaxOutputTokens = llmConfig?.max_output_tokens || null;

        if (selectedAgent?.id) {
            initAgentCodeScripts(selectedAgent.id);
        } else {
            codeScripts = [];
        }
    }

    /** @param {{ provider: import('$commonTypes').LlmConfig | null, model: string | null, reasoning_effort_level: string | null, max_output_tokens: number | null }} detail */
    function onLlmSelected(detail) {
        selectedProvider = detail.provider || null;
        selectedModel = detail.model || '';
        selectedReasoningEffortLevel = detail.reasoning_effort_level || null;
        selectedMaxOutputTokens = detail.max_output_tokens || null;
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

<div class="instruct-test mb-6 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
    <div class="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
        <div class="flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <i class="mdi mdi-flask-outline text-xl"></i>
            </span>
            <div class="min-w-0 flex-1">
                <h5 class="mb-0 truncate text-base font-semibold text-dark dark:text-gray-100">{$_('Try It Out')}</h5>
                <p class="mb-0 truncate text-xs text-muted">
                    {selectedAgent ? `Testing agent: ${selectedAgent.name}` : 'Configure an agent in the pane below to begin'}
                </p>
            </div>
        </div>
    </div>
    <div class="p-6">
        <textarea
            class="instruct-input thin-scrollbar w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-dark transition-colors placeholder:text-muted focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-700/40 dark:text-gray-100 dark:focus:bg-gray-800"
            rows={8}
            maxlength={maxLength}
            disabled={isThinking}
            placeholder={'Enter input message...'}
            bind:value={text}
            onkeydown={(e) => pressKey(e)}
        ></textarea>
        <div class="mt-1 flex items-center justify-between text-xs text-muted">
            <div>
                {#if elapsedTime}
                    <span class="inline-flex items-center gap-1">
                        <i class="mdi mdi-timer-outline text-sm leading-none"></i>
                        {`Elapsed: ${elapsedTime}`}
                    </span>
                {/if}
            </div>
            <div>{formatNumber(text?.length || 0)}/{formatNumber(maxLength)}</div>
        </div>

        <div class="mt-3 flex justify-end">
            <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!text || util.trim(text).length === 0 || isThinking}
                onclick={() => sendRequest()}
            >
                <i class="mdi mdi-send align-middle leading-none"></i>
                {'Send'}
            </button>
        </div>

        {#if isThinking}
            <div class="mt-4 flex justify-center">
                <LoadingDots duration={'1s'} size={12} gap={5} color={'var(--color-primary)'} />
            </div>
        {:else if requestDone && !!result}
            <div
                class="mt-4 rounded-lg border-l-4 border-primary bg-primary/5 p-5 dark:bg-primary/10"
                in:fly={{ y: -10, duration: 500 }}
            >
                <div class="mb-3 flex items-center justify-between">
                    <div class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                        <i class="mdi mdi-robot-happy-outline text-base leading-none"></i>
                        {'Response'}
                    </div>
                    <button
                        type="button"
                        class="inline-flex h-7 w-7 items-center justify-center rounded-md bg-danger/15 text-danger transition-all hover:scale-105 hover:bg-danger/25"
                        aria-label="Close response"
                        title="Close"
                        onclick={() => closeResponse()}
                    >
                        <i class="mdi mdi-close text-base leading-none"></i>
                    </button>
                </div>
                <div class="thin-scrollbar max-h-[500px] overflow-y-auto rounded-md border border-gray-100 bg-white p-3 text-sm leading-relaxed text-dark dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                    <Markdown containerClasses={'markdown-dark text-dark'} text={result} rawText />
                </div>
            </div>
        {:else if requestDone && !result}
            <div class="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-700/30">
                <i class="mdi mdi-emoticon-confused-outline text-3xl text-muted leading-none"></i>
                <p class="mt-2 mb-0 text-sm text-muted">{"Ehhh, no idea..."}</p>
            </div>
        {/if}
    </div>
</div>

<div class="instruct-config mb-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
    <div class="lg:col-span-7 lg:min-h-0">
        <div class="flex h-full flex-col rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
            <div class="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                <div class="flex items-center gap-3">
                    <span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <i class="mdi mdi-script-text-outline text-xl"></i>
                    </span>
                    <div class="min-w-0 flex-1">
                        <h5 class="mb-0 truncate text-base font-semibold text-dark dark:text-gray-100">{'Instruction'}</h5>
                        <p class="mb-0 truncate text-xs text-muted">
                            {selectedTemplate ? `Template: ${selectedTemplate}` : 'Live preview of the agent instruction'}
                        </p>
                    </div>
                    <div class="flex items-center leading-none text-muted" id="demo-tooltip">
                        <i class="bx bx-info-circle text-lg leading-none"></i>
                    </div>
                    <BotsharpTooltip target="demo-tooltip" placement="left" containerClasses="demo-tooltip-note">
                        <div>Please select an agent to proceed!</div>
                    </BotsharpTooltip>
                </div>
            </div>
            <div class="flex flex-1 flex-col p-6">
                <textarea
                    class="instruct-preview thin-scrollbar w-full flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs leading-relaxed text-dark dark:border-gray-700 dark:bg-gray-700/30 dark:text-gray-100"
                    rows={19}
                    maxlength={maxLength}
                    disabled
                    placeholder={''}
                    bind:value={instruction}
                ></textarea>
            </div>
        </div>
    </div>
    <div class="lg:col-span-5 lg:min-h-0">
        <div class="instruct-config-card flex h-full flex-col rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
            <div class="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                <div class="flex items-center gap-3">
                    <span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <i class="mdi mdi-cog-outline text-xl"></i>
                    </span>
                    <div class="min-w-0 flex-1">
                        <h5 class="mb-0 truncate text-base font-semibold text-dark dark:text-gray-100">{'Configuration'}</h5>
                        <p class="mb-0 truncate text-xs text-muted">Agent, LLM, States and Code script</p>
                    </div>
                </div>
            </div>
            <div class="flex flex-1 flex-col px-6 pt-4 pb-6">
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

                <div class="flex-1" class:hide={selectedTab !== 'instruction-agent'}>
                    <InstructionAgent
                        agents={agents}
                        disabled={isThinking}
                        onSelectAgent={detail => onAgentSelected(detail)}
                    />
                </div>
                <div class="flex-1" class:hide={selectedTab !== 'instruction-llm'}>
                    <InstructionLlm
                        llmConfigs={llmConfigs}
                        disabled={isThinking}
                        bind:selectedProvider={selectedProvider}
                        bind:selectedModel={selectedModel}
                        bind:selectedReasoningEffortLevel={selectedReasoningEffortLevel}
                        bind:selectedMaxOutputTokens={selectedMaxOutputTokens}
                        onSelectLlm={detail => onLlmSelected(detail)}
                    />
                </div>
                <div class="flex-1" class:hide={selectedTab !== 'instruction-states'}>
                    <InstructionState
                        bind:states={states}
                        disabled={isThinking}
                    />
                </div>
                <div class="flex-1" class:hide={selectedTab !== 'instruction-coding'}>
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


