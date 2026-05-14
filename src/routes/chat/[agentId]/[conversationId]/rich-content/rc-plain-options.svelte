<script>
	import { getContext, onMount } from "svelte";
    import { fade } from 'svelte/transition';
    import SveltePlayer from "svelte-player";
    import { ElementType } from "$lib/helpers/enums";
	import ChatFileUploader from "../chat-util/chat-file-uploader.svelte";

    /**
     * @type {{
     *   isMultiSelect?: boolean,
     *   disabled?: boolean,
     *   options?: any[],
     *   onConfirm?: (args0: string, args1: string) => any,
     *   confirmBtnText?: string
     * }}
     */
    let {
        isMultiSelect = false,
        disabled = false,
        options = [],
        confirmBtnText = 'Continue',
        onConfirm = () => {}
    } = $props();

    const duration = 1000;
    const separator = '|';
    const specialElementTypes = [
        ElementType.Video,
        ElementType.File
    ];

    /** @type {string[]} */
    let titleAnswers = $state([]);
    /** @type {string[]} */
    let payloadAnswers = $state([]);
    /** @type {any[]} */
    let plainOptions = $state([]);
    /** @type {any[]} */
    let videoOptions = $state([]);
    /** @type {any} */
    let fileOption = $state(undefined);

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
                type: op.type,
                url: op.url,
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

        if (option.type === ElementType.Web && option.url) {
            window.open(option.url);
            return;
        }

        if (!isMultiSelect) {
            innerConfirm(option?.title, option?.payload);
        } else {
            plainOptions = plainOptions.map((op, idx) => {
                if (idx === index) {
                    op.isClicked = !op.isClicked;
                    if (op.isClicked) {
                        titleAnswers = [...titleAnswers, op.title];
                        if (op.payload) {
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
<div class="rcpo-video-row rcpo-center">
    {#each videoOptions as video}
        <div class="rcpo-video-card" in:fade={{ duration: duration }}>
            <div class="rcpo-video-body">
                <div class="rcpo-video-title">
                    {video.title}
                </div>
                <div class="rcpo-video-player">
                    <SveltePlayer url={video.payload} controls />
                </div>
            </div>
        </div>
    {/each}
</div>
{/if}

{#if plainOptions || fileOption}
<div class="rcpo-option-row rcpo-center">
    {#each plainOptions as option, index}
        <button
            class={`rcpo-btn ${option.is_secondary ? 'rcpo-btn-secondary' : 'rcpo-btn-primary'}`}
            class:rcpo-active={!!option.isClicked}
            disabled={disabled}
            in:fade={{ duration: duration }}
            onclick={(e) => handleClickOption(e, option, index)}
        >
            <span class={`${option.type === ElementType.Web && option.url ? 'rcpo-link' : ''}`}>
                {option.title}
            </span>
        </button>
    {/each}
    {#if plainOptions && isMultiSelect}
        <button
            class="rcpo-btn rcpo-btn-confirm"
            name="confirm"
            in:fade={{ duration: duration }}
            disabled={disabled || plainOptions.every(x => !x.isClicked)}
            onclick={(e) => handleConfirm(e)}
        >
            {confirmBtnText || 'Continue'}
        </button>
    {/if}
    {#if fileOption}
        <ChatFileUploader accept=".png,.jpg,.jpeg" containerClasses={'rcpo-uploader'}>
            <span class="rcpo-uploader-glyph" in:fade={{ duration: duration }}>
                <i class="bx bx-image-add"></i>
            </span>
        </ChatFileUploader>
    {/if}
</div>
{/if}

<style>
    /* Centered row — replaces .center-option (justify-content: center, 0 10px) */
    .rcpo-center {
        justify-content: center;
        padding: 0 10px;
    }

    /* ===== Video row (replaces .video-option-container + nested elements) ===== */
    .rcpo-video-row {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
    }
    .rcpo-video-card {
        flex: 1 1 300px;
        border: 0;
        box-shadow: none;
        background-color: transparent;
    }
    /* Inner body (replaces .card .card-body with !important padding:0) */
    .rcpo-video-body {
        padding: 0;
    }
    .rcpo-video-title {
        font-size: 1.1em;
        font-weight: 700;
        padding: 10px 0 10px 5px;
        margin-bottom: 5px;
        width: 100%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    .rcpo-video-player {
        aspect-ratio: 16 / 9;
    }
    .rcpo-video-player :global(video),
    .rcpo-video-player :global(iframe) {
        border-radius: 10px;
        height: 100%;
    }

    /* ===== Plain option row (replaces .plain-option-container) ===== */
    .rcpo-option-row {
        display: flex;
        flex-wrap: wrap;
    }

    /* Themed action buttons (replace .btn .btn-sm .m-1 .btn-outline-primary/secondary/success).
       The .btn:not([name="confirm"]):hover legacy rule swapped to white bg + primary text;
       .btn.active:hover kept primary bg + white text. We replicate that behavior here. */
    .rcpo-btn {
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
    .rcpo-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
    .rcpo-btn-primary {
        color: var(--color-primary);
        border-color: var(--color-primary);
    }
    .rcpo-btn-primary:hover:not(:disabled) {
        background-color: rgb(255 255 255);
        color: var(--color-primary);
    }
    .rcpo-btn-secondary {
        color: var(--color-secondary);
        border-color: var(--color-secondary);
    }
    .rcpo-btn-secondary:hover:not(:disabled) {
        background-color: rgb(255 255 255);
        color: var(--color-primary);
    }
    .rcpo-btn-confirm {
        color: var(--color-success, #34c38f);
        border-color: var(--color-success, #34c38f);
    }
    .rcpo-btn-confirm:hover:not(:disabled) {
        background-color: var(--color-success, #34c38f);
        color: rgb(255 255 255);
    }
    /* Active selection (replaces Bootstrap .btn.active rule) */
    .rcpo-active {
        background-color: var(--color-primary);
        color: rgb(255 255 255);
    }
    .rcpo-active:hover:not(:disabled) {
        background-color: var(--color-primary);
        color: rgb(255 255 255);
    }

    /* Link-style hover underline (replaces .link-option:hover) */
    .rcpo-link:hover {
        text-decoration: underline;
    }

    /* File uploader trigger inside the option row (replaces
       'line-align-center text-primary chat-uploader' containerClasses).
       Applied on a <div> inside a child component, hence :global(). */
    :global(.rcpo-uploader) {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-primary);
        font-size: 18px;
    }
    .rcpo-uploader-glyph {
        position: relative;
        top: 3px;
    }
</style>