<script>
    import { onMount } from 'svelte';
    import { Card, CardBody } from '@sveltestrap/sveltestrap';
    import { getLlmConfigs } from '$lib/services/llm-provider-service';
    import { LlmModelCapability, LlmModelType } from '$lib/helpers/enums';
	import ChatConfig from './llm-configs/chat-config.svelte';
	import LlmBasicConfig from './llm-configs/llm-basic-config.svelte';
    
    /** @type {import('$agentTypes').AgentModel} */
    export let agent;

    /** @type {() => void} */
    export let handleAgentChange = () => {};

    export const fetchLlmConfig = () => {
        const chatConfig = chatConfigCmp?.fetchConfig();
        const imageCompositionConfig = imageCompositionConfigCmp?.fetchConfig();
        const audioTranscriptionConfig = audioTranscriptionConfigCmp?.fetchConfig();
        const realtimeConfig = realtimeConfigCmp?.fetchConfig();
        return {
            ...chatConfig,
            image_composition: imageCompositionConfig ? {...imageCompositionConfig} : null,
            audio_transcription: audioTranscriptionConfig ? {...audioTranscriptionConfig} : null,
            realtime: realtimeConfig ? {...realtimeConfig} : null
        };
    }

    /** @type {any} */
    let chatConfigCmp;
    /** @type {any} */
    let imageCompositionConfigCmp;
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
            <ChatConfig
                bind:this={chatConfigCmp}
                {agent}
                {llmConfigs}
                {handleAgentChange}
            />
            <LlmBasicConfig
                title="Image Composition"
                bind:this={imageCompositionConfigCmp}
                llmConfigOptions={llmConfigs}
                llmConfig={agent.llm_config?.image_composition}
                modelType={LlmModelType.Image}
                modelCapability={LlmModelCapability.ImageComposition} 
                {handleAgentChange}
            />
            <LlmBasicConfig
                title="Audio Transcription"
                bind:this={audioTranscriptionConfigCmp}
                llmConfigOptions={llmConfigs}
                llmConfig={agent.llm_config?.audio_transcription}
                modelType={LlmModelType.Audio}
                modelCapability={LlmModelCapability.AudioTranscription} 
                {handleAgentChange}
            />
            <LlmBasicConfig
                title="Realtime"
                bind:this={realtimeConfigCmp}
                llmConfigOptions={llmConfigs}
                llmConfig={agent.llm_config?.realtime}
                modelType={LlmModelType.Realtime}
                modelCapability={LlmModelCapability.Realtime} 
                {handleAgentChange}
            />
        </div>
    </CardBody>
</Card>