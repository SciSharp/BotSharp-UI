<script>
    import { onMount } from 'svelte';
    import { Card, CardBody, FormGroup, Label, Input, CardHeader } from '@sveltestrap/sveltestrap';
    import NavBar from '$lib/common/nav-bar/NavBar.svelte';
	import NavItem from '$lib/common/nav-bar/NavItem.svelte';
    
    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

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
        local_instructions = [
            {
                channel: defaultChannel,
                instruction: agent.instruction
            },
            ...agent.channel_instructions
        ];

        selected_instruction = local_instructions[0];
    });

    /** @param {string} channel */
    function selectChannel(channel) {
        if (channel === selected_instruction.channel) {
            return;
        }

        selected_instruction = local_instructions.find(x => x.channel === channel) || { ...defaultInstruction };
    }

    /** @param {any} e */
    function changePrompt(e) {
        e.preventDefault();
        const value = e.target.value;
        selected_instruction.instruction = value || '';

        if (selected_instruction.channel === defaultChannel) {
            agent.instruction = selected_instruction.instruction;
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
            <Label for="formmessage">Description:</Label>
            <Input
                type="textarea"
                id="formmessage"
                class="form-control"
                style="scrollbar-width: thin; resize: none;"
                rows="4"
                bind:value={agent.description}
                placeholder="Enter your Message"
            />
        </FormGroup>
        
        <FormGroup class="mb-3" style="overflow-y: auto; scrollbar-width: none;">
            <Label for="form-prompt">System Prompt:</Label>
            {#if local_instructions.length > 1}
            <NavBar
                id={'agent-instruction-container'}
                disableDefaultStyles
                containerClasses={'nav-tabs-secondary'}
            >
                {#each local_instructions as inst, idx (idx) }
                <NavItem
                    containerStyles={`flex: 0 1 calc(100% / ${local_instructions.length})`}
                    navBtnId={`${inst.channel}-prompt-tab`}
                    dataBsTarget={`#${inst.channel}-prompt-tab-pane`}
                    ariaControls={`${inst.channel}-prompt-tab-pane`}
                    navBtnText={inst.channel}
                    active={inst.channel === selected_instruction.channel}
                    onClick={() => selectChannel(inst.channel)}
                />
                {/each}
            </NavBar>
            {/if}
            <Input
                type="textarea"
                id="form-prompt"
                class="form-control"
                style="scrollbar-width: thin; resize: none;"
                rows="24"
                value={selected_instruction.instruction}
                on:input={(e) => changePrompt(e)}
                placeholder="Enter your Prompt"
            />
        </FormGroup>
    </CardBody>
</Card>