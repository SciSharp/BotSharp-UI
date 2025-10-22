<script>
    import { onMount } from 'svelte';
    import { Card, CardBody } from '@sveltestrap/sveltestrap';
    import { getLlmConfigs } from '$lib/services/llm-provider-service';
	import ChatConfig from './llm-configs/chat-config.svelte';
	import ImageGenerationConfig from './llm-configs/image-generation-config.svelte';
	import ImageEditConfig from './llm-configs/image-edit-config.svelte';
	import AudioTranscriptionConfig from './llm-configs/audio-transcription-config.svelte';
	import RealtimeConfig from './llm-configs/realtime-config.svelte';
    
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
            <ImageGenerationConfig bind:this={imageGenerationConfigCmp} {agent} {llmConfigs} {handleAgentChange} />
            <ImageEditConfig bind:this={imageEditConfigCmp} {agent} {llmConfigs} {handleAgentChange} />
            <AudioTranscriptionConfig bind:this={audioTranscriptionConfigCmp} {agent} {llmConfigs} {handleAgentChange} />
            <RealtimeConfig bind:this={realtimeConfigCmp} {agent} {llmConfigs} {handleAgentChange} />
        </div>
    </CardBody>
</Card>