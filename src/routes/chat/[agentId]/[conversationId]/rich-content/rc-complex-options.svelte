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

<style>
    /* ===== Card grid (replaces .complex-option-container) ===== */
    .rcco-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
        margin-top: 10px;
    }

    /* Individual card (replaces .card-element + outer .card) */
    .rcco-card {
        flex: 1 1 50%;
        max-width: calc(50% - 2.5px);
        border: 2px solid var(--color-border, #dee2e6);
        border-radius: 10px;
        background-color: rgb(255 255 255);
        margin-bottom: 0;
        overflow: hidden;
    }

    /* Card inner body (replaces .card-body.card-element-body) */
    .rcco-card-body {
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        gap: 5px;
        padding: 10px 15px;
        overflow-y: auto;
        scrollbar-width: thin;
    }

    .rcco-title {
        font-size: 0.85rem;
        font-weight: 700;
    }
    .rcco-subtitle {
        font-size: 0.8rem;
        font-weight: 500;
    }
    .rcco-text {
        font-size: 0.75rem;
        font-weight: 400;
        padding: 5px;
    }
    /* Clamp long text — replaces legacy .hide-text marker class (was undefined,
       but the visual intent is to ellipsize / hide overflow). */
    .rcco-clip {
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* Avatar slot (replaces .avatar-md + .avatar-title.rounded-circle.bg-light.text-danger.font-size-16) */
    .rcco-avatar {
        height: 4.5rem;
        width: 4.5rem;
    }
    .rcco-avatar-frame {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;
        border-radius: 50%;
        background-color: var(--color-light, #eff2f7);
        color: var(--color-danger, #f46a6a);
        font-size: 16px;
    }
    .rcco-avatar-img {
        border-radius: 50%;
    }

    /* Per-card button group (replaces .card-option-group + nested .btn rules) */
    .rcco-option-group {
        margin-top: 5px;
    }
    .rcco-option-group .rcco-btn {
        display: block;
        margin-left: 0 !important;
        border-radius: 10px;
        width: 100%;
    }

    /* Bottom button row (replaces .plain-option-container.center-option) */
    .rcco-button-row {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        padding: 0 10px;
        margin-top: 5px;
    }

    /* Themed action buttons (replace .btn .btn-sm .m-1 .btn-outline-primary/secondary) */
    .rcco-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 50px;
        margin: 0.25rem;
        padding: 0.25rem 0.6rem;
        font-size: 0.8125rem;
        line-height: 1.2;
        border-radius: 10px;
        border: 1px solid transparent;
        background-color: transparent;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }
    .rcco-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
    .rcco-btn-primary {
        color: var(--color-primary);
        border-color: var(--color-primary);
    }
    .rcco-btn-primary:hover:not(:disabled) {
        background-color: rgb(255 255 255);
        color: var(--color-primary);
    }
    .rcco-btn-secondary {
        color: var(--color-secondary);
        border-color: var(--color-secondary);
    }
    .rcco-btn-secondary:hover:not(:disabled) {
        background-color: rgb(255 255 255);
        color: var(--color-primary);
    }

    /* Link-style hover underline (replaces .link-option:hover under .card-option-group) */
    .rcco-link:hover {
        text-decoration: underline;
    }
</style>