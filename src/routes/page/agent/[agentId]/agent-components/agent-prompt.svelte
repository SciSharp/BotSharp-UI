<script>
    import { onMount } from 'svelte';
    import { Card, CardBody, FormGroup, Input, CardHeader } from '@sveltestrap/sveltestrap';
    import NavBar from '$lib/common/nav-bar/NavBar.svelte';
	import NavItem from '$lib/common/nav-bar/NavItem.svelte';
    import { v4 as uuidv4 } from 'uuid';
    import util from "lodash";
	import { _ } from 'svelte-i18n';
    
    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    export const fetchChannelPrompts = () => {
        const candidates = local_instructions?.filter((x, idx) => idx > 0 && !!x.channel?.trim())?.map(x => {
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
            systemPrompt: local_instructions[0].instruction,
            channelPrompts: prompts
        };
    }

    export const refreshChannelPrompts = () => init();

    const defaultChannel = "default";

    /** @type {import('$agentTypes').ChannelInstruction} */
    const defaultInstruction = {
        channel: defaultChannel,
        instruction: ''
    };

    /** @type {import('$agentTypes').ChannelInstruction[]} */
    let local_instructions = [];

    /** @type {import('$agentTypes').ChannelInstruction} */
    let selected_instruction = { ...defaultInstruction };

    onMount(() => {
        init();
    });

    function init() {
        local_instructions = [
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

        selected_instruction = local_instructions[0];
    }

    /** @param {string | undefined} uid */
    function selectChannel(uid) {
        if (uid === selected_instruction.uid) {
            return;
        }

        selected_instruction = local_instructions.find(x => x.uid === uid) || { ...defaultInstruction };
    }

    /** @param {any} e */
    function changePrompt(e) {
        e.preventDefault();
        const value = e.target.value;
        selected_instruction.instruction = value || '';
    }

    function addChannel() {
        local_instructions = [
            ...local_instructions,
            {
                uid: uuidv4(),
                channel: '',
                instruction: ''
            }
        ];
    }

    /** @param {string | undefined} uid */
    function deleteChannel(uid) {
        local_instructions = local_instructions.filter(x => x.uid !== uid);
        if (selected_instruction.uid === uid) {
            selected_instruction = local_instructions[0];
        }
    }
</script>

<Card class="agent-prompt-container">
    <CardHeader class="agent-prompt-header border-bottom">
        <div class="d-flex">
            <div class="flex-grow-1">
                <h5 class="fw-semibold">{agent.name}</h5>
            </div>
        </div>
    </CardHeader>
    <CardBody>
        <FormGroup class="mb-3">
            <div class="mb-2">
                <div class="line-align-center fw-bold">
                    {'Description:'}
                </div>
            </div>
            <Input
                type="textarea"
                class="form-control"
                style="scrollbar-width: thin; resize: none;"
                rows={4}
                bind:value={agent.description}
                placeholder="Enter your Message"
            />
        </FormGroup>
        
        <FormGroup class="mb-3" style="overflow-y: auto; scrollbar-width: none;">
            <div class="mb-2" style="display: flex; gap: 10px;">
                <div class="line-align-center fw-bold">
                    {#if local_instructions.length > 1}
                        {'Instructions:'}
                    {:else}
                        {'System instruction:'}
                    {/if}
                </div>
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div
                    class="text-primary clickable"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Add channel instruction"
                    style="font-size: 16px;"
                    on:click={() => addChannel()}
                >
                    <i class="mdi mdi-plus-circle-outline" />
                </div>
            </div>
            
            {#if local_instructions.length > 1}
            <NavBar
                id={'agent-instruction-container'}
                disableDefaultStyles
                containerClasses={'nav-tabs-secondary'}
            >
                {#each local_instructions as inst, idx (idx) }
                <NavItem
                    containerStyles={`flex: 0 1 calc(100% / ${local_instructions.length <= 2 ? local_instructions.length : 3})`}
                    navBtnStyles={'text-transform: none;'}
                    navBtnId={`${inst.channel}-prompt-tab`}
                    dataBsTarget={`#${inst.channel}-prompt-tab-pane`}
                    ariaControls={`${inst.channel}-prompt-tab-pane`}
                    bind:navBtnText={inst.channel}
                    active={inst.uid === selected_instruction.uid}
                    allowEdit={idx > 0}
                    allowDelete={idx > 0}
                    maxEditLength={20}
                    editPlaceholder={'Type a channel name here...'}
                    onClick={() => selectChannel(inst.uid)}
                    onDelete={() => deleteChannel(inst.uid)}
                />
                {/each}
            </NavBar>
            {/if}
            <Input
                type="textarea"
                class="form-control"
                style="scrollbar-width: thin; resize: none;"
                value={selected_instruction.instruction}
                rows={24}
                on:input={(e) => changePrompt(e)}
                placeholder="Enter your instruction"
            />
        </FormGroup>
    </CardBody>
</Card>