<script>
	import { getContext, onMount } from "svelte";
    import SveltePlayer from "svelte-player";
    import { Card, CardBody } from "@sveltestrap/sveltestrap";
    import { ElementType } from "$lib/helpers/enums";

    /** @type {boolean} */
    export let isMultiSelect = false;

    /** @type {boolean} */
    export let disabled = false;

    /** @type {any[]} */
    export let options = [];

    /** @type {(args0: string, args1: string) => any} */
    export let onConfirm = () => {};

    /** @type {string} */
    export let confirmBtnText = 'Continue';

    const separator = '|';

    /** @type {string[]} */
    let titleAnswers = [];
    /** @type {string[]} */
    let payloadAnswers = [];
    /** @type {any[]} */
    let plainOptions = [];
    /** @type {any[]} */
    let videoOptions = [];

    const { autoScrollToBottom }  = getContext('chat-window-context');

    onMount(() => {
        reset();
        collectOptions(options);
        autoScrollToBottom?.();
    });

    /** @param {any[]} options */
    function collectOptions(options) {
        const innerOptions = options?.filter(op => !!op.title && !!op.payload) || [];

        videoOptions = innerOptions?.filter(op => op.type == ElementType.Video);
        plainOptions = innerOptions?.filter(op => op.type != ElementType.Video)?.map(op => {
            return {
                title: op.title,
                payload: op.payload,
                is_primary: op.is_primary,
                is_secondary: op.is_secondary,
                isClicked: false
            };
        }) || [];
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
            plainOptions = plainOptions.map((op, idx) => {
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
        plainOptions = [];
        videoOptions = [];
        titleAnswers = [];
        payloadAnswers = [];
    }

</script>

{#if videoOptions.length > 0}
<div>
    <div class="video-option-container">
        {#each videoOptions as video, index}
            <Card class="video-element-card">
                <CardBody>
                    <div class="video-element-title">
                        {video.title}
                    </div>
                    <div class="video-element-player">
                        <SveltePlayer url={video.payload} controls />
                    </div>
                </CardBody>
            </Card>
        {/each}
    </div>
</div>
{/if}

{#if plainOptions.length > 0}
<div class="plain-option-container">
    {#each plainOptions as option, index}
        <button
            class={`btn btn-sm m-1 ${option.is_secondary ? 'btn-outline-secondary': 'btn-outline-primary'}`}
            class:active={!!option.isClicked}
            disabled={disabled}
            on:click={(e) => handleClickOption(e, option, index)}
        >
            {option.title}
        </button>
    {/each}
    {#if isMultiSelect}
        <button
            class="btn btn-outline-success btn-sm m-1"
            name="confirm"
            disabled={disabled || plainOptions.every(x => !!!x.isClicked)}
            on:click={(e) => handleConfirm(e)}
        >
            {confirmBtnText || 'Continue'}
        </button>
    {/if}
</div>
{/if}