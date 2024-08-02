<script>
	import { getContext, onMount } from "svelte";
    import { fade } from 'svelte/transition';
    import SveltePlayer from "svelte-player";
    import { Card, CardBody } from "@sveltestrap/sveltestrap";
    import { ElementType } from "$lib/helpers/enums";
	import ChatImageUploader from "../chat-util/chat-image-uploader.svelte";

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

    const duration = 1000;
    const separator = '|';
    const specialElementTypes = [
        ElementType.Video,
        ElementType.File
    ];

    /** @type {string[]} */
    let titleAnswers = [];
    /** @type {string[]} */
    let payloadAnswers = [];
    /** @type {any[]} */
    let plainOptions = [];
    /** @type {any[]} */
    let videoOptions = [];
    /** @type {any} */
    let fileOption;

    const { autoScrollToBottom }  = getContext('chat-window-context');

    onMount(() => {
        reset();
        collectOptions(options);
        autoScrollToBottom?.();
    });

    /** @param {any[]} options */
    function collectOptions(options) {
        const innerOptions = options?.filter(op => !!op.title) || [];

        videoOptions = innerOptions?.filter(op => op.type == ElementType.Video);
        fileOption = options?.find(op => op.type == ElementType.File);
        plainOptions = innerOptions?.filter(op => !specialElementTypes.includes(op.type))?.map(op => {
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
                        if (!!op.payload) {
                            payloadAnswers = [...payloadAnswers, op.payload];
                        }
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

{#if videoOptions}
<div class="video-option-container center-option">
    {#each videoOptions as video, index}
        <div class="video-element-card" in:fade={{ duration: duration }}>
            <Card>
                <CardBody>
                    <div class="video-element-title">
                        {video.title}
                    </div>
                    <div class="video-element-player">
                        <SveltePlayer url={video.payload} controls />
                    </div>
                </CardBody>
            </Card>
        </div>
    {/each}
</div>
{/if}

{#if plainOptions || fileOption}
<div class="plain-option-container center-option">
    {#each plainOptions as option, index}
        <button
            class={`btn btn-sm m-1 ${option.is_secondary ? 'btn-outline-secondary': 'btn-outline-primary'}`}
            class:active={!!option.isClicked}
            disabled={disabled}
            in:fade={{ duration: duration }}
            on:click={(e) => handleClickOption(e, option, index)}
        >
            {option.title}
        </button>
    {/each}
    {#if plainOptions && isMultiSelect}
        <button
            class="btn btn-outline-success btn-sm m-1"
            name="confirm"
            in:fade={{ duration: duration }}
            disabled={disabled || plainOptions.every(x => !!!x.isClicked)}
            on:click={(e) => handleConfirm(e)}
        >
            {confirmBtnText || 'Continue'}
        </button>
    {/if}
    {#if fileOption}
        <ChatImageUploader>
            <span style="position: relative; top: 3px;" in:fade={{ duration: duration }}>
                <i class="bx bx-image-add" />
            </span>
        </ChatImageUploader>
    {/if}
</div>
{/if}