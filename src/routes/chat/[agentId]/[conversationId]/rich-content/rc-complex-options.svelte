<script>
    import { getContext, onMount } from "svelte";
	import { Card, CardBody } from "@sveltestrap/sveltestrap";
    
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
                    is_primary: x.is_primary,
                    is_secondary: x.is_secondary,
                };
            }) || [];

            return {
                title: op.title,
                subtitle: op.subtitle,
                options: options
            };
        }) || [];

        buttons = options?.filter(op => !!!op.title && !!!op.subtitle)?.flatMap(op => {
            // @ts-ignore
            return op.buttons?.filter(x => !!x.title)?.map(x => {
                return {
                    title: x.title,
                    payload: x.payload,
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
        innerConfirm(option?.title, option?.payload);
    }

    /**
	 * @param {string} title
     * @param {string} payload
	 */
    function innerConfirm(title, payload) {
        onConfirm && onConfirm(title, payload);
        reset();
    }

    function reset() {
        cards = [];
    }
</script>

{#if cards.length > 0}
    <div class="complex-option-container">
        {#each cards as card, idx (idx)}
        <Card class="card-element">
            <CardBody class="card-element-body">
                {#if !!card.title}
                    <div class="card-element-title hide-text">{card.title}</div>
                {/if}
                {#if !!card.subtitle}
                    <div class="card-element-subtitle hide-text">{@html card.subtitle}</div>
                {/if}
                {#if card.options?.length > 0}
                    <div class="card-option-group">
                        {#each card.options as option, i (i)}
                            <button
                                class={`btn btn-sm m-1 ${option.is_secondary ? 'btn-outline-secondary': 'btn-outline-primary'}`}
                                disabled={disabled}
                                on:click={(e) => handleClickOption(e, option)}
                            >
                                {option.title}
                            </button>
                        {/each}
                    </div>
                {/if}
            </CardBody>
        </Card>
        {/each}
    </div>
{/if}

{#if buttons.length > 0}
    <div class="plain-option-container center-option" style="margin-top: 5px;">
        {#each buttons as option, index}
            <button
                class={`btn btn-sm m-1 ${option.is_secondary ? 'btn-outline-secondary': 'btn-outline-primary'}`}
                disabled={disabled}
                on:click={(e) => handleClickOption(e, option)}
            >
                {option.title}
            </button>
        {/each}
    </div>
{/if}