<script>
    import { fly } from 'svelte/transition';
    import { Button } from '@sveltestrap/sveltestrap';
	import Markdown from '$lib/common/markdown/Markdown.svelte';
	import { utcToLocal } from '$lib/helpers/datetime';

    /** @type {import('$instructTypes').InstructionLogModel} */
    export let item;

    /** @type {boolean} */
    let open = false;

    function toggleLogDetail() {
        open = !open;
    }
</script>

<tr in:fly={{ y: -5, duration: 800 }}>
    <td class="instruction-log-col ellipsis">{item.agent_name || 'N/A'}</td>
    <td class="instruction-log-col ellipsis">{item.provider}</td>
    <td class="instruction-log-col ellipsis">{item.model}</td>
    <td class="instruction-log-col ellipsis">{item.template_name || 'N/A'}</td>
    <td class="instruction-log-col ellipsis">{item.user_name || 'N/A'}</td>
    <td class="instruction-log-col ellipsis">{utcToLocal(item.created_time)}</td>
    <td>
        <ul class="list-unstyled hstack gap-1 mb-0" style="justify-content: center;">
            <li data-bs-toggle="tooltip" data-bs-placement="top" title="Detail">
                <Button
                    class="btn btn-sm btn-soft-warning"
                    on:click={() => toggleLogDetail()}
                >
                    <i class="mdi mdi-eye-outline" />
                </Button>
            </li>
        </ul>
    </td>
</tr>


{#if open}
    <tr in:fly={{ y: -5, duration: 800 }} out:fly={{ y: -5, duration: 300 }}>
        <td colspan="12">
            <div class="instruction-log-detail-container">
                {#if !!item.system_instruction}
                <div>
                    <div class="text-primary fw-bold">
                        {'System instruction:'}
                    </div>
                    <div class="instruction-log-message">
                        <Markdown containerClasses={'markdown-dark text-dark'} text={item.system_instruction} rawText />
                    </div>
                </div>
                {/if}
                {#if !!item.user_message}
                <div>
                    <div class="text-primary fw-bold">
                        {'User message:'}
                    </div>
                    <div class="instruction-log-message">
                        <Markdown containerClasses={'markdown-dark text-dark'} text={item.user_message || ''} rawText />
                    </div>
                </div>
                {/if}
                {#if !!item.completion_text}
                <div>
                    <div class="text-primary fw-bold">
                        {'Completion text:'}
                    </div>
                    <div class="instruction-log-message">
                        <Markdown containerClasses={'markdown-dark text-dark'} text={item.completion_text} rawText />
                    </div>
                </div>
                {/if}
            </div>
        </td>
    </tr>
{/if}