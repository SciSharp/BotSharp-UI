<script>
    import { onMount } from 'svelte';
    import { getLlmConfigs } from '$lib/services/llm-provider-service';
    import { LlmModelCapability, LlmModelType } from '$lib/helpers/enums';
    import ChatConfig from './llm-configs/chat-config.svelte';
    import LlmBasicConfig from './llm-configs/llm-basic-config.svelte';

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
    </div>
</div>

<style>
    .llmc-card {
        background-color: rgb(255 255 255);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.625rem;
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.04),
            0 6px 16px -10px rgb(15 23 42 / 0.08);
    }
    .llmc-card-body {
        padding: 1.25rem;
    }
    .llmc-header {
        text-align: center;
        margin-bottom: 1rem;
    }
    .llmc-title {
        margin: 0.25rem 0 0.5rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: rgb(55 65 81);
    }
    .llmc-brand-logo {
        height: 50px;
        width: auto;
        display: inline-block;
    }
    .llmc-list {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        max-height: 500px;
        overflow-y: auto;
        scrollbar-width: thin;
        padding: 0 0.625rem;
    }

    /* ===== Dark mode ===== */
    :global(.dark) .llmc-card {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
    }
    :global(.dark) .llmc-title {
        color: rgb(229 231 235);
    }
</style>