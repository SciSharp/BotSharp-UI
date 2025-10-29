<script>
    import { onMount } from 'svelte';
    import { Card, CardBody } from '@sveltestrap/sveltestrap';
    import { getLlmConfigs } from '$lib/services/llm-provider-service';
    import { LlmModelCapability } from '$lib/helpers/enums';
	import ChatConfig from './llm-configs/chat-config.svelte';
	import LlmBasicConfig from './llm-configs/llm-basic-config.svelte';
    
    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    /** @type {() => void} */
    export let handleAgentChange = () => {};

    export const fetchLlmConfig = () => {
        const chatConfig = chatConfigCmp?.fetchConfig();
        const imageGenerationConfig = imageGenerationConfigCmp?.fetchConfig();
        const imageEditConfig = imageEditConfigCmp?.fetchConfig();
        const audioTranscriptionConfig = audioTranscriptionConfigCmp?.fetchConfig();
        const realtimeConfig = realtimeConfigCmp?.fetchConfig();
        return {
            ...chatConfig,
            image_generation: imageGenerationConfig ? {...imageGenerationConfig} : null,
            image_edit: imageEditConfig ? {...imageEditConfig} : null,
            audio_transcription: audioTranscriptionConfig ? {...audioTranscriptionConfig} : null,
            realtime: realtimeConfig ? {...realtimeConfig} : null
        };
    }

    /** @type {any} */
    let chatConfigCmp;
    /** @type {any} */
    let imageGenerationConfigCmp;
    /** @type {any} */
    let imageEditConfigCmp;
    /** @type {any} */
    let audioTranscriptionConfigCmp;
    /** @type {any} */
    let realtimeConfigCmp;
    
    /** @type {import('$commonTypes').LlmConfig[]} */
    let llmConfigs = [];

    onMount(async () =>{
        await init();
    });

    async function init() {
        llmConfigs = await getLlmConfigs();
    }
</script>

<Card>
    <CardBody>
        <div class="text-center">
            <h5 class="mt-1 mb-1">LLM Configurations</h5>
            <img src="images/brands/azure-openai-logo.avif" alt="" height="50" />
        </div>

        <div class="agent-utility-container">
            <ChatConfig bind:this={chatConfigCmp} {agent} {llmConfigs} {handleAgentChange} />
            <LlmBasicConfig
                title="Image Generation"
                bind:this={imageGenerationConfigCmp}
                llmConfigOptions={llmConfigs}
                llmConfig={agent.llm_config?.image_generation}
                modelCapability={LlmModelCapability.ImageGeneration} 
                {handleAgentChange}
            />
            <LlmBasicConfig
                title="Image Edit"
                bind:this={imageEditConfigCmp}
                llmConfigOptions={llmConfigs}
                llmConfig={agent.llm_config?.image_edit}
                modelCapability={LlmModelCapability.ImageEdit} 
                {handleAgentChange}
            />
            <LlmBasicConfig
                title="Audio Transcription"
                bind:this={audioTranscriptionConfigCmp}
                llmConfigOptions={llmConfigs}
                llmConfig={agent.llm_config?.audio_transcription}
                modelCapability={LlmModelCapability.AudioTranscription} 
                {handleAgentChange}
            />
            <LlmBasicConfig
                title="Realtime"
                bind:this={realtimeConfigCmp}
                llmConfigOptions={llmConfigs}
                llmConfig={agent.llm_config?.realtime}
                modelCapability={LlmModelCapability.Realtime} 
                {handleAgentChange}
            />
        </div>
    </CardBody>
</Card>