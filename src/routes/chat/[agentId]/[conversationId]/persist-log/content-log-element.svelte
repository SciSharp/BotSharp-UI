<script>
    import Markdown from "$lib/common/markdown/Markdown.svelte";
    import CollapsibleText from '$lib/common/shared/CollapsibleText.svelte';
	import { ContentLogSource } from '$lib/helpers/enums';
	import { utcToLocal } from '$lib/helpers/datetime';
	import { directToAgentPage } from '$lib/helpers/utils/common';

    /** @type {{ data: import('$conversationTypes').ConversationContentLogModel }} */
    let { data } = $props();

    let copied = $state(false);
    /** @type {any} */
    let copiedTimer = null;

    const unknownAgent = "Uknown";
    const collapsedSources = [
        ContentLogSource.UserInput,
        ContentLogSource.Prompt,
        ContentLogSource.AgentResponse,
        ContentLogSource.FunctionCall,
        ContentLogSource.Notification
    ];

    const rawTextSources = [
        ContentLogSource.AgentResponse,
        ContentLogSource.FunctionCall,
    ];

    let logDisplayStyle = $derived.by(() => {
        if (data.source === ContentLogSource.AgentResponse || data.source === ContentLogSource.Notification) {
            return '';
        } else if (data.source === ContentLogSource.FunctionCall) {
            return 'cle-bg-secondary';
        } else if (data.source === ContentLogSource.Prompt) {
            return 'cle-text-secondary';
        } else if (data.source === ContentLogSource.HardRule) {
            return 'cle-text-warning';
        } else if (data.source === ContentLogSource.UserInput) {
            return 'cle-bg-danger';
        }
        return '';
    });

    let logTextStyle = $derived.by(() => {
        if (data.source === ContentLogSource.AgentResponse || data.source === ContentLogSource.Notification) {
            return 'cle-text-info';
        }
        return '';
    });

    /** @param {MouseEvent} e */
    function copyContent(e) {
        e.preventDefault();
        e.stopPropagation();

        const text = data?.content || '';
        if (!text) return;

        navigator.clipboard?.writeText(text).then(() => {
            copied = true;
            clearTimeout(copiedTimer);
            copiedTimer = setTimeout(() => {
                copied = false;
            }, 800);
        }).catch(() => {
            copied = false;
        });
    }

    $effect(() => {
        return () => clearTimeout(copiedTimer);
    });
</script>


<div class="cle-element" id={`content-log-${data.message_id}`}>
    <div class="cle-meta">
        <div class="cle-meta-row">
            <span class="cle-title">
            {#if data?.agent_id?.length > 0}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <span
                    class="cle-link"
                    onclick={() => directToAgentPage(data.agent_id)}
                >
                    {data.name || unknownAgent}
                </span>
            {:else}
                <span class="cle-text-secondary">
                    {data.name || unknownAgent}
                </span>
            {/if}
            </span>
            <button
                type="button"
                class="cle-copy-btn"
                class:cle-copy-btn-done={copied}
                title={copied ? 'Copied!' : 'Copy content'}
                aria-label={copied ? 'Content copied' : 'Copy content'}
                onclick={(e) => copyContent(e)}
            >
                {#if copied}
                    <i class="bx bx-check"></i>
                    <span>{'Copied!'}</span>
                {:else}
                    <i class="bx bx-copy"></i>
                    <span>{'Copy'}</span>
                {/if}
            </button>
        </div>
        <span class="cle-meta-ts">{`${utcToLocal(data?.created_at, 'hh:mm:ss.SSS A, MMM DD YYYY')} `}</span>
    </div>
    <div class={`cle-content ${logDisplayStyle}`}>
        <!--
            Only the sources in `collapsedSources` are worth folding: a hard rule
            or a state change runs to a line or two, and a toggle on those would
            be more chrome than content.
        -->
        <CollapsibleText enabled={collapsedSources.includes(data.source)}>
            <Markdown containerClasses={logTextStyle} text={data?.content} rawText={rawTextSources.includes(data.source)} />
        </CollapsibleText>
    </div>

    {#if data.message_id && data.source === ContentLogSource.UserInput}
    <div class="cle-msg-id">
        {`Message id: ${data.message_id}`}
    </div>
    {/if}
</div>

