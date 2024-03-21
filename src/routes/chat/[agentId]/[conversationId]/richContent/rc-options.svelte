<script>
	import { onMount } from "svelte";

    /** @type {boolean} */
    export let isMultiSelect = false;

    /** @type {boolean} */
    export let disableOption = false;

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
        localOptions = filterOptions(options);
    });

    /** @param {any[]} options */
    function filterOptions(options) {
        /** @type {any[]} */
        let res = [];
        options?.map(op => {
            if (!!!op.title || !!!op.payload) {
                return;
            }

            if (op.buttons?.length > 0) {
                // @ts-ignore
                op.buttons?.map(x => {
                    if (!!x.title && !!x.payload) {
                        res.push({
                            title: x.title,
                            payload: x.payload,
                            isClicked: false
                        });
                    }
                });
            } else {
                res.push({
                    title: op.title,
                    payload: op.payload,
                    isClicked: false
                });
            }
        });

        return res;
    }

    /**
	 * @param {any} e
     * @param {string} payload
     * @param {number} index
	 */
    function handleClickOption(e, payload, index) {
        e.preventDefault();

        if (!isMultiSelect) {
            innerConfirm(payload);
        } else {
            localOptions = localOptions.map((op, idx) => {
                if (idx === index) {
                    op.isClicked = !op.isClicked;
                    if (op.isClicked) {
                        answers = [...answers, op.payload];
                    } else {
                        answers = answers.filter(a => a != op.payload);
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
        const payload = answers.join(separator);
        innerConfirm(payload);
    }

    /**
	 * @param {string} payload
	 */
    function innerConfirm(payload) {
        onConfirm && onConfirm(payload);
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
    <button class="btn btn-outline-primary btn-rounded btn-sm m-1" class:active={!!option.isClicked} disabled={disableOption} on:click={(e) => handleClickOption(e, option.payload, index)}>{option.title}</button>
    {/each}
    {#if isMultiSelect}
    <button class="btn btn-outline-success btn-rounded btn-sm m-1" name="confirm" disabled={disableOption || localOptions.every(x => !!!x.isClicked)} on:click={(e) => handleConfirm(e)}>{confirmBtnText}</button>
    {/if}
</div>
{/if}