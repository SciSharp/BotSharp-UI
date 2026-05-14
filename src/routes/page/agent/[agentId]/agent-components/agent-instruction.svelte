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

<div class="ai-card">
    <div class="ai-card-header">
        <h5 class="ai-agent-name">{agent.name}</h5>
    </div>
    <div class="ai-card-body">
        <div class="ai-section">
            <div class="ai-section-label">
                {'Description:'}
            </div>
            <textarea
                class="ai-textarea ai-textarea-sm"
                rows={4}
                bind:value={agent.description}
                placeholder="Enter your Message"
                oninput={() => handleAgentChange()}
            ></textarea>
        </div>

        <div class="ai-section">
            <div class="ai-section-header">
                <div class="ai-section-label">
                    {#if inner_instructions.length > 1}
                        {'Instructions:'}
                    {:else}
                        {'System instruction:'}
                    {/if}
                </div>
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    class="ai-add-btn"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Add channel instruction"
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
                class="ai-textarea"
                value={selected_instruction.instruction}
                rows={20}
                oninput={(e) => changePrompt(e)}
                onkeydown={(e) => onKeyDown(e)}
                placeholder="Enter your instruction"
            ></textarea>
        </div>
    </div>
</div>

<style>
    /* ===== Card shell ===== */
    .ai-card {
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.625rem;
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.04),
            0 6px 16px -10px rgb(15 23 42 / 0.08);
        overflow: hidden;
    }
    .ai-card-header {
        padding: 0.9375rem 1.25rem;
        background-color: rgb(255 255 255);
        border-bottom: 1px solid rgb(229 231 235);
    }
    .ai-agent-name {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: rgb(55 65 81);
    }
    .ai-card-body {
        padding: 1.25rem;
        overflow-y: auto;
        scrollbar-width: none;
    }

    /* ===== Section ===== */
    .ai-section {
        margin-bottom: 1rem;
    }
    .ai-section:last-child {
        margin-bottom: 0;
    }
    .ai-section-header {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        margin-bottom: 0.5rem;
    }
    .ai-section-label {
        display: inline-flex;
        align-items: center;
        font-weight: 700;
        font-size: 0.875rem;
        color: rgb(55 65 81);
        margin-bottom: 0.5rem;
    }
    .ai-section-header .ai-section-label {
        margin-bottom: 0;
    }

    /* ===== Add channel button ===== */
    .ai-add-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--color-primary);
        cursor: pointer;
        font-size: 1rem;
        line-height: 1;
        transition: color 0.15s ease, transform 0.15s ease;
    }
    .ai-add-btn:hover {
        color: var(--color-primary-hover);
        transform: scale(1.1);
    }
    .ai-add-btn i {
        font-size: 1.25rem;
        line-height: 1;
    }

    /* ===== Textareas ===== */
    .ai-textarea {
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
    .ai-textarea::placeholder {
        color: var(--color-muted);
    }
    .ai-textarea:focus {
        outline: 0;
        border-color: var(--color-primary);
        background-color: rgb(255 255 255);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
    }

    /* ===== Dark mode ===== */
    :global(.dark) .ai-card,
    :global(.dark) .ai-card-header {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .ai-agent-name,
    :global(.dark) .ai-section-label {
        color: rgb(229 231 235);
    }
    :global(.dark) .ai-textarea {
        background-color: rgb(17 24 39);
        border-color: rgb(55 65 81);
        color: rgb(229 231 235);
    }
</style>