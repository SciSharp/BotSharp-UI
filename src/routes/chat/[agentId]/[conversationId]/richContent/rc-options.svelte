<script>
	import { onMount } from "svelte";

    /** @type {boolean} */
    export let isMultiSelect = false;

    /** @type {boolean} */
    export let disableOption = false;

    /** @type {boolean} */
    export let fillPostback = false;

    /** @type {any[]} */
    export let options = [];

    /** @type {(args0: string) => any} */
    export let onConfirm;

    /** @type {string} */
    export let confirmBtnText = 'Continue';

    const separator = '|';

    /** @type {string[]} */
    let answers = [];
    /** @type {any[]} */
    let localOptions = [];

    onMount(() => {
        answers = [];
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
            innerConfirm(fillPostback ? option?.payload : option?.title);
        } else {
            localOptions = localOptions.map((op, idx) => {
                if (idx === index) {
                    op.isClicked = !op.isClicked;
                    if (op.isClicked) {
                        if (fillPostback) {
                            answers = [...answers, op.payload];
                        } else {
                            answers = [...answers, op.title];
                        }
                    } else {
                        if (fillPostback) {
                            answers = answers.filter(a => a != op.payload);
                        } else {
                            answers = answers.filter(a => a != op.title);
                        }
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
        const answer = answers.join(separator);
        innerConfirm(answer);
    }

    /**
	 * @param {string} answer
	 */
    function innerConfirm(answer) {
        onConfirm && onConfirm(answer);
        reset();
    }

    function reset() {
        localOptions = [];
        answers = [];
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