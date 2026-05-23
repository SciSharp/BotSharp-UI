<script>
    import { onMount } from 'svelte';
    import { getLlmConfigs } from '$lib/services/llm-provider-service';
    import { LlmModelCapability, LlmModelType } from '$lib/helpers/enums';
    import ChatConfig from './llm-configs/chat-config.svelte';
    import LlmBasicConfig from './llm-configs/llm-basic-config.svelte';
    import RealtimeConfig from './llm-configs/realtime-config.svelte';

    /**
     * @type {{
     *   agent: import('$agentTypes').AgentModel,
     *   handleAgentChange?: () => void
     * }}
     */
    let {
        agent,
        handleAgentChange = () => {}
    } = $props();

    export function fetchLlmConfig() {
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
    let chatConfigCmp = $state(null);
    /** @type {any} */
    let imageCompositionConfigCmp = $state(null);
    /** @type {any} */
    let audioTranscriptionConfigCmp = $state(null);
    /** @type {any} */
    let realtimeConfigCmp = $state(null);

    /** @type {import('$commonTypes').LlmConfig[]} */
    let llmConfigs = $state([]);

    onMount(async () => {
        llmConfigs = await getLlmConfigs();
    });
</script>

<div class="llmc-card">
    <div class="llmc-card-body">
        <div class="llmc-header">
            <h5 class="llmc-title">LLM Configurations</h5>
            <img src="images/brands/azure-openai-logo.avif" alt="" class="llmc-brand-logo" />
        </div>

        <div class="llmc-list">
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
            <RealtimeConfig
                title="Realtime"
                bind:this={realtimeConfigCmp}
                llmConfigOptions={llmConfigs}
                llmConfig={agent.llm_config?.realtime}
                {handleAgentChange}
            />
        </div>
    </div>
</div>

