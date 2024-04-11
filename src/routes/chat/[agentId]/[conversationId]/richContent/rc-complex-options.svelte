<script>
	import { Card, CardBody } from "@sveltestrap/sveltestrap";
    import { onMount } from "svelte";

    /** @type {boolean} */
    export let disableOption = false;

    /** @type {any[]} */
    export let options = [];

    /** @type {(args0: string, args1: string) => any} */
    export let onConfirm;

    /** @type {() => any} */
    export let refresh = () => {};

    /** @type {any[]} */
    let cards = [];

    onMount(() => {
        reset();
        collectOptions(options);
        refresh && refresh();
    });

    /** @param {any[]} options */
    function collectOptions(options) {
        cards = options?.map(op => {
            // @ts-ignore
            const options = op.buttons?.filter(op => !!op.title && !!op.payload)?.map(x => {
                return {
                    title: x.title,
                    payload: x.payload
                };
            }) || [];

            return {
                title: op.title,
                subtitle: op.subtitle,
                options: options
            };
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
    <div class="card-group-container">
        {#each cards as card, idx (idx)}
        <Card class="card-element">
            <CardBody>
                {#if !!card.title}
                <div class="card-element-title mb-3">{card.title}</div>
                {/if}
                {#if !!card.subtitle}
                <div class="card-element-subtitle mb-3">{card.subtitle}</div>
                {/if}
                {#if card.options?.length > 0}
                    <div class="card-option-group">
                        {#each card.options as option, i (i)}
                            <button
                                class="btn btn-outline-primary btn-sm m-1"
                                disabled={disableOption}
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
