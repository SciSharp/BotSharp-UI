<script>
    import { getContext, onMount } from "svelte";
    import { fade } from 'svelte/transition';
	import { ElementType } from "$lib/helpers/enums";

    /**
     * @type {{
     *   disabled?: boolean,
     *   options?: any[],
     *   onConfirm?: (args0: string, args1: string) => any
     * }}
     */
    let {
        disabled = false,
        options = [],
        onConfirm
    } = $props();

    /** @type {any[]} */
    let cards = $state([]);
    /** @type {any[]} */
    let buttons = $state([]);

    const duration = 1000;

    const { autoScrollToBottom }  = getContext('chat-window-context');

    onMount(() => {
        reset();
        collectOptions(options)
        autoScrollToBottom?.();
    });

    /** @param {any[]} options */
    function collectOptions(options) {
        cards = options?.filter(op => !!op.title || !!op.subtitle)?.map(op => {
            // @ts-ignore
            const options = op.buttons?.filter(x => !!x.title)?.map(x => {
                return {
                    title: x.title,
                    payload: x.payload,
                    type: x.type,
                    url: x.url,
                    is_primary: x.is_primary,
                    is_secondary: x.is_secondary,
                };
            }) || [];

            return {
                title: op.title,
                subtitle: op.subtitle,
                text: op.text,
                image_url: op.image_url,
                options: options
            };
        }) || [];

        buttons = options?.filter(op => !op.title && !op.subtitle)?.flatMap(op => {
            // @ts-ignore
            return op.buttons?.filter(x => !!x.title)?.map(x => {
                return {
                    title: x.title,
                    payload: x.payload,
                    type: x.type,
                    url: x.url,
                    is_primary: x.is_primary,
                    is_secondary: x.is_secondary,
                };
            }) || [];;
        }) || [];
    }

    /**
	 * @param {any} e
     * @param {any} option
	 */
    function handleClickOption(e, option) {
        e.preventDefault();

        if (option.type === ElementType.Web && option.url) {
            window.open(option.url);
            return;
        }

        innerConfirm(option?.title, option?.payload);
    }

    /**
	 * @param {string} title
     * @param {string} payload
	 */
    function innerConfirm(title, payload) {
        onConfirm?.(title, payload);
        reset();
    }

    function reset() {
        cards = [];
    }
</script>

{#if cards}
    <div class="rcco-grid">
        {#each cards as card, idx (idx)}
            <div class="rcco-card" in:fade={{ duration: duration }}>
                <div class="rcco-card-body">
                    {#if !!card.title}
                        <div class="rcco-title rcco-clip">{card.title}</div>
                    {/if}
                    {#if !!card.image_url}
                        <div class="rcco-avatar">
                            <span class="rcco-avatar-frame">
                                <img src={card.image_url} alt="" height="60" class="rcco-avatar-img">
                            </span>
                        </div>
                    {/if}
                    {#if !!card.subtitle}
                        <div class="rcco-subtitle rcco-clip">{@html card.subtitle}</div>
                    {/if}
                    {#if !!card.text}
                        <div class="rcco-text rcco-clip">{card.text}</div>
                    {/if}
                    {#if card.options?.length > 0}
                        <div class="rcco-option-group">
                            {#each card.options as option, i (i)}
                                <button
                                    class={`rcco-btn ${option.is_secondary ? 'rcco-btn-secondary' : 'rcco-btn-primary'}`}
                                    disabled={disabled}
                                    onclick={(e) => handleClickOption(e, option)}
                                >
                                    <span class={`${option.type === ElementType.Web && option.url ? 'rcco-link' : ''}`}>{option.title}</span>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        {/each}
    </div>
{/if}

{#if buttons}
    <div class="rcco-button-row">
        {#each buttons as option, index (index)}
            <button
                class={`rcco-btn ${option.is_secondary ? 'rcco-btn-secondary' : 'rcco-btn-primary'}`}
                in:fade={{ duration: duration }}
                disabled={disabled}
                onclick={(e) => handleClickOption(e, option)}
            >
                {option.title}
            </button>
        {/each}
    </div>
{/if}

