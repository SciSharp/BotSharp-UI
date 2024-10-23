<script>
    import { getContext, onMount } from "svelte";
    import { fade } from 'svelte/transition';
	import { Card, CardBody } from "@sveltestrap/sveltestrap";
	import { ElementType } from "$lib/helpers/enums";
    
    /** @type {boolean} */
    export let disabled = false;

    /** @type {any[]} */
    export let options = [];

    /** @type {(args0: string, args1: string) => any} */
    export let onConfirm;

    /** @type {any[]} */
    let cards = [];
    /** @type {any[]} */
    let buttons = [];

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

        buttons = options?.filter(op => !!!op.title && !!!op.subtitle)?.flatMap(op => {
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
    <div class="complex-option-container">
        {#each cards as card, idx (idx)}
            <div class="card-element" in:fade={{ duration: duration }}>
                <Card>
                    <CardBody class="card-element-body">
                        {#if !!card.title}
                            <div class="card-element-title hide-text">{card.title}</div>
                        {/if}
                        {#if !!card.image_url}
                            <div class="avatar-md">
                                <span class="avatar-title rounded-circle bg-light text-danger font-size-16">
                                    <img src={card.image_url} alt="" height="60" class="rounded-circle">
                                </span>
                            </div>
                        {/if}
                        {#if !!card.subtitle}
                            <div class="card-element-subtitle hide-text">{@html card.subtitle}</div>
                        {/if}
                        {#if !!card.text}
                            <div class="card-element-text hide-text">{card.text}</div>
                        {/if}
                        {#if card.options?.length > 0}
                            <div class="card-option-group">
                                {#each card.options as option, i (i)}
                                    <button
                                        class={`btn btn-sm m-1 ${option.is_secondary ? 'btn-outline-secondary': 'btn-outline-primary'}`}
                                        disabled={disabled}
                                        on:click={(e) => handleClickOption(e, option)}
                                    >
                                        <span class={`${option.type === ElementType.Web && option.url ? 'link-option' : ''}`}>{option.title}</span>
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </CardBody>
                </Card>
            </div>
        {/each}
    </div>
{/if}

{#if buttons}
    <div class="plain-option-container center-option" style="margin-top: 5px;">
        {#each buttons as option, index}
            <button
                class={`btn btn-sm m-1 ${option.is_secondary ? 'btn-outline-secondary': 'btn-outline-primary'}`}
                in:fade={{ duration: duration }}
                disabled={disabled}
                on:click={(e) => handleClickOption(e, option)}
            >
                {option.title}
            </button>
        {/each}
    </div>
{/if}