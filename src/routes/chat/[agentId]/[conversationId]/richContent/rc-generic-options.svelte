<script>
	import { Card, CardBody } from "@sveltestrap/sveltestrap";
    import { onMount } from "svelte";


    /** @type {boolean} */
    export let disableOption = false;

    /** @type {boolean} */
    export let fillPostback = false;

    /** @type {any[]} */
    export let options = [];

    /** @type {(args0: string) => any} */
    export let onConfirm;

    /** @type {any[]} */
    let cards = [];

    onMount(() => {
        cards = collectOptions(options);
    });

    /** @param {any[]} options */
    function collectOptions(options) {
        const res = options?.map(op => {
            // @ts-ignore
            const options = op.buttons?.map(x => {
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

        return res;
    }

    /**
	 * @param {any} e
     * @param {any} option
	 */
    function handleClickOption(e, option) {
        e.preventDefault();
        innerConfirm(fillPostback ? option?.payload : option?.title);
    }

    /**
	 * @param {string} answer
	 */
    function innerConfirm(answer) {
        onConfirm && onConfirm(answer);
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
                <div class="card-element-title">{card.title}</div>
                {/if}
                {#if !!card.subtitle}
                <div class="card-element-subtitle">{card.subtitle}</div>
                {/if}
                {#if card.options?.length > 0}
                    <div class="card-option-group">
                        {#each card.options as option, i (i)}
                            <button
                                class="btn btn-outline-primary btn-rounded btn-sm m-1"
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
