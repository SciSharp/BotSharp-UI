<script>
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import util from "lodash";
	import { Button, Col, Row } from '@sveltestrap/sveltestrap';
	import LoadingDots from '$lib/common/LoadingDots.svelte';
	import HeadTitle from '$lib/common/HeadTitle.svelte';
    import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import Markdown from '$lib/common/markdown/Markdown.svelte';
	import InstructionSetting from './instruction-components/instruction-setting.svelte';
	import InstructionState from './instruction-components/instruction-state.svelte';
	import { getAgents } from '$lib/services/agent-service';
	import LoadingToComplete from '$lib/common/LoadingToComplete.svelte';
	import { sendChatCompletion } from '$lib/services/instruct-service';
	import { getLlmConfigs } from '$lib/services/llm-provider-service';
	import { LlmModelType } from '$lib/helpers/enums';

    const maxLength = 64000;
    const DEFAULT_PROVIDER = 'openai';
    const DEFAULT_MODEL = 'gpt-4o-mini';

    let isLoading = false;
    let isThinking = false;
    let requestDone = false;
    
    let text = '';
    let instruction = '';
    let result = '';
    let elapsedTime = '';

    /** @type {import('$agentTypes').AgentModel | null} */
    let selectedAgent = null;

    /** @type {string | null} */
    let selectedProvider = null;

    /** @type {string | null} */
    let selectedModel = null;
    
    /** @type {import('$agentTypes').AgentModel[]} */
    let agents = [];

    /** @type {import('$commonTypes').LlmConfig[]} */
    let llmConfigs = [];

    /** @type {any[]} */
    let states = [
        { key: '', value: ''}
    ];

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
        isThinking = true;
        requestDone = false;
        elapsedTime = '';
        const formattedStates = formatStates(states);
        const start = new Date();
        sendChatCompletion({
            text: util.trim(text) || '',
            instruction: util.trim(instruction) || null,
            agentId: selectedAgent?.id,
            provider: selectedProvider || DEFAULT_PROVIDER,
            model: selectedModel || DEFAULT_MODEL,
            states: formattedStates
        }).then(res => {
            result = res || '';
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
        selectedAgent = e.detail.selectedAgent || null;
        instruction = selectedAgent?.instruction || '';

        const template = e.detail.selectedTemplate || null;
        if (!!template) {
            instruction = template?.content || '';
        }

        onLlmSelected(e);
    }
    
    /** @param {any} e */
    function onLlmSelected(e) {
        selectedProvider = e.detail.selectedProvider || null;
        selectedModel = e.detail.selectedModel || '';
    }
</script>

<HeadTitle title="{$_('Instruction')}" />
<Breadcrumb pagetitle="{$_('Instruction')}" title="{$_('Instruction')}"/>
<LoadingToComplete isLoading={isLoading} />

<div class="d-xl-flex">
	<div class="w-100">
        <div class="instruction-container mb-4">
            <textarea
                class='form-control knowledge-textarea'
                rows={8}
                maxlength={maxLength}
                disabled={isThinking}
                placeholder={'Start typing here...'}
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


<div class="d-xl-flex mt-3">
    <div class="w-100">
        <InstructionSetting
            disabled={isThinking}
            agents={agents}
            llmConfigs={llmConfigs}
            on:agentSelected={e => onAgentSelected(e)}
            on:llmSelected={e => onLlmSelected(e)}
        />
    </div>
</div>


<div class="d-xl-flex mt-4 mb-5">
	<div class="w-100">
        <Row class="instruct-setting-container">
            <Col lg="9">
                <div>
                    <div class="instruct-text-header text-primary fw-bold mb-2">
                        <div class="line-align-center">
                            {'Instruction'}
                        </div>
                        <div class="line-align-center">
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <i
                                class="mdi mdi-refresh text-primary clickable"
                                data-bs-toggle="tooltip"
                                data-bs-placement="bottom"
                                title={'Reset'}
                                on:click={e => resetInstruction()}
                            />
                        </div>
                    </div>
                    <div class="instruct-setting-section instruction-border instruct-setting-padding">
                        <textarea
                            class='form-control knowledge-textarea'
                            rows={19}
                            maxlength={maxLength}
                            disabled={isThinking}
                            placeholder={'Start typing here...'}
                            bind:value={instruction}
                        />
                    </div>
                </div>
            </Col>
            <Col lg="3">
                <InstructionState bind:states={states} disabled={isThinking} />
            </Col>
        </Row>
    </div>
</div>