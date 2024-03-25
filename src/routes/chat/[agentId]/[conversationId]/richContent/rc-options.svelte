<script>
	import { onMount } from "svelte";

    /** @type {boolean} */
    export let isMultiSelect = false;

    /** @type {boolean} */
    export let disableOption = false;

    /** @type {any[]} */
    export let options = [];

    /** @type {(args0: string, args1: string) => any} */
    export let onConfirm;

    /** @type {string} */
    export let confirmBtnText = 'Continue';

    const separator = '|';

    /** @type {string[]} */
    let titleAnswers = [];
    /** @type {string[]} */
    let payloadAnswers = [];
    /** @type {any[]} */
    let localOptions = [];

    onMount(() => {
        reset();
        localOptions = collectOptions(options);
    });

    /** @param {any[]} options */
    function collectOptions(options) {
        const res = options?.map(op => {
            return {
                title: op.title,
                payload: op.payload,
                isClicked: false
            };
        }) || [];

        return res;
    }

    /**
	 * @param {any} e
     * @param {any} option
     * @param {number} index
	 */
    function handleClickOption(e, option, index) {
        e.preventDefault();

        if (!isMultiSelect) {
            innerConfirm(option?.title, option?.payload);
        } else {
            localOptions = localOptions.map((op, idx) => {
                if (idx === index) {
                    op.isClicked = !op.isClicked;
                    if (op.isClicked) {
                        titleAnswers = [...titleAnswers, op.title];
                        payloadAnswers = [...payloadAnswers, op.payload];
                    } else {
                        const targetIdx = titleAnswers.findIndex(a => a == op.title);
                        titleAnswers = titleAnswers.filter((x, index) => index != targetIdx);
                        payloadAnswers = payloadAnswers.filter((x, index) => index != targetIdx);
                    }
                }
                return op;
            });
        }
    }

    /**
	 * @param {any} e
	 */
    function handleConfirm(e) {
        e.preventDefault();
        const titles = titleAnswers.join(separator);
        const payloads = payloadAnswers.join(separator);
        innerConfirm(titles, payloads);
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
        localOptions = [];
        titleAnswers = [];
        payloadAnswers = [];
    }

</script>

{#if localOptions.length > 0}
<div class="button-group">
    {#each localOptions as option, index}
        <button
            class="btn btn-outline-primary btn-rounded btn-sm m-1"
            class:active={!!option.isClicked}
            disabled={disableOption}
            on:click={(e) => handleClickOption(e, option, index)}
        >
            {option.title}
        </button>
    {/each}
    {#if isMultiSelect}
        <button
            class="btn btn-outline-success btn-rounded btn-sm m-1"
            name="confirm"
            disabled={disableOption || localOptions.every(x => !!!x.isClicked)}
            on:click={(e) => handleConfirm(e)}
        >
            {confirmBtnText || 'Continue'}
        </button>
    {/if}
</div>
{/if}