<script>
    import { onMount } from 'svelte';
    import { v4 as uuidv4 } from 'uuid';
    import util from "lodash";
    import NavBar from '$lib/common/nav-bar/NavBar.svelte';
    import NavItem from '$lib/common/nav-bar/NavItem.svelte';

    const defaultChannel = "default";

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

    export function fetchInstructions() {
        const candidates = inner_instructions?.filter((x, idx) => idx > 0 && !!x.channel?.trim())?.map(x => {
            return { channel: x.channel.trim().toLowerCase(), instruction: x.instruction };
        });

        const prompts = [];
        const groups = util.groupBy(candidates, (/** @type {any} */ x) => x.channel);
        for (const key in groups) {
            if (groups[key]?.length > 0) {
                prompts.push(groups[key][0]);
            }
        }

        return {
            systemPrompt: inner_instructions[0].instruction,
            channelPrompts: prompts
        };
    }

    export function refresh() {
        init();
    }

    /** @type {import('$agentTypes').ChannelInstruction} */
    const defaultInstruction = {
        channel: defaultChannel,
        instruction: ''
    };

    /** @type {import('$agentTypes').ChannelInstruction[]} */
    let inner_instructions = $state([]);

    /** @type {import('$agentTypes').ChannelInstruction} */
    let selected_instruction = $state({ ...defaultInstruction });

    onMount(() => {
        init();
    });

    function init() {
        inner_instructions = [
            {
                uid: uuidv4(),
                channel: defaultChannel,
                instruction: agent.instruction
            },
            ...agent.channel_instructions?.map(x => ({
                uid: uuidv4(),
                channel: x.channel,
                instruction: x.instruction
            })) || []
        ];

        selected_instruction = inner_instructions[0];
    }

    /** @param {string | undefined} uid */
    function selectChannel(uid) {
        if (uid === selected_instruction.uid) {
            return;
        }

        selected_instruction = inner_instructions.find(x => x.uid === uid) || { ...defaultInstruction };
    }

    /** @param {any} e */
    function changePrompt(e) {
        e.preventDefault();
        const value = e.target.value;
        selected_instruction.instruction = value || '';
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

    function addChannel() {
        inner_instructions = [
            ...inner_instructions,
            {
                uid: uuidv4(),
                channel: '',
                instruction: ''
            }
        ];

        selected_instruction = inner_instructions[inner_instructions.length-1];
        handleAgentChange();
    }

    /** @param {string | undefined} uid */
    function deleteChannel(uid) {
        inner_instructions = inner_instructions.filter(x => x.uid !== uid);
        if (selected_instruction.uid === uid) {
            selected_instruction = inner_instructions[0];
        }
        handleAgentChange();
    }
</script>

<div class="card agent-prompt-container">
    <div class="card-header agent-prompt-header border-bottom">
        <div class="d-flex">
            <div class="flex-grow-1">
                <h5 class="fw-semibold">{agent.name}</h5>
            </div>
        </div>
    </div>
    <div class="card-body">
        <div class="mb-3">
            <div class="mb-2">
                <div class="line-align-center fw-bold">
                    {'Description:'}
                </div>
            </div>
            <textarea
                class="form-control"
                style="scrollbar-width: thin; resize: none;"
                rows={4}
                bind:value={agent.description}
                placeholder="Enter your Message"
                oninput={() => handleAgentChange()}
            ></textarea>
        </div>

        <div class="mb-3 agent-prompt-body">
            <div class="mb-2" style="display: flex; gap: 10px;">
                <div class="line-align-center fw-bold">
                    {#if inner_instructions.length > 1}
                        {'Instructions:'}
                    {:else}
                        {'System instruction:'}
                    {/if}
                </div>
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    class="text-primary clickable"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Add channel instruction"
                    style="font-size: 16px;"
                    onclick={() => addChannel()}
                >
                    <i class="mdi mdi-plus-circle-outline"></i>
                </div>
            </div>

            {#if inner_instructions.length > 1}
            <NavBar
                id={'agent-instruction-container'}
                disableDefaultStyles
                containerClasses={'nav-tabs-secondary'}
            >
                {#each inner_instructions as inst, idx (idx) }
                <NavItem
                    containerStyles={`flex: 0 1 calc(100% / ${inner_instructions.length <= 2 ? inner_instructions.length : 3})`}
                    navBtnStyles={'text-transform: none;'}
                    navBtnId={`${inst.channel}-prompt-tab`}
                    dataBsTarget={`#${inst.channel}-prompt-tab-pane`}
                    ariaControls={`${inst.channel}-prompt-tab-pane`}
                    bind:navBtnText={inst.channel}
                    active={inst.uid === selected_instruction.uid}
                    allowEdit={idx > 0}
                    allowDelete={idx > 0}
                    maxEditLength={20}
                    editPlaceholder={'Type a channel here...'}
                    onClick={() => selectChannel(inst.uid)}
                    onDelete={() => deleteChannel(inst.uid)}
                    onInput={handleAgentChange}
                />
                {/each}
            </NavBar>
            {/if}
            <textarea
                class="form-control"
                style="scrollbar-width: thin; resize: none;"
                value={selected_instruction.instruction}
                rows={20}
                oninput={(e) => changePrompt(e)}
                onkeydown={(e) => onKeyDown(e)}
                placeholder="Enter your instruction"
            ></textarea>
        </div>
    </div>
</div>