<script>
	import { Portal } from '@sveltestrap/sveltestrap';
    import { onMount, onDestroy } from 'svelte';
    import { createPopper } from '@popperjs/core';
    import { v4 as uuidv4 } from 'uuid';
	import { classnames } from '$lib/helpers/utils/common';
    import { clickoutsideDirective } from "$lib/helpers/directives";
    
    /**
     * Additional CSS class names for the tooltip.
     * @type {string}
     */
    export let containerClasses = '';

    /**
     * Flag to enable animation for the tooltip.
     * @type {boolean}
     */
    export let animation = true;

    /**
     * Unique identifier for the tooltip.
     * @type {string}
     */
    export let id = `tooltip_${uuidv4()}`;

    /**
     * Controls the visibility of the tooltip.
     * @type {boolean}
     */
    export let isOpen = false;

    /**
     * Controls the visibility of the tooltip after hover the attached element.
     * @type {boolean}
     */
    export let persist = false;

    /**
     * The preferred placement of the tooltip.
     * @type {string}
     */
    export let placement = 'top';

    /**
     * The target element to which the tooltip is attached.
     * @type {string | HTMLElement}
     */
    export let target = '';

    /**
     * The theme name override to apply to this component instance.
     * @type {string | null}
     */
    export let theme = null;

    /**
     * The delay for showing the tooltip (in milliseconds).
     * @type {number}
     */
    export let delay = 0;

    /** @type {string} */
    let bsPlacement = 'start';
    /** @type {object} */
    let popperInstance;
    /** @type {string} */
    let popperPlacement = placement;
    /** @type {HTMLDivElement | null} */
    let targetEl;
    /** @type {HTMLDivElement | null} */
    let tooltipEl;
    /** @type {number} */
    let showTimer;

    const checkPopperPlacement = {
        name: 'checkPopperPlacement',
        enabled: true,
        phase: 'main',
        // @ts-ignore
        fn(args) {
            popperPlacement = args.state.placement;
        }
    };


    onMount(() => {
        registerEventListeners();
    });

    onDestroy(() => {
        unregisterEventListeners();
        clearTimeout(showTimer);
    });

    const open = () => {
        clearTimeout(showTimer);
        showTimer = setTimeout(() => (isOpen = true), delay);
    };

    const close = () => {
        clearTimeout(showTimer);
        isOpen = false;
    };

    function registerEventListeners() {
        // eslint-disable-next-line eqeqeq
        if (target == null || !target) {
            targetEl = null;
            return;
        }

        try {
            if (target instanceof HTMLElement) {
                // @ts-ignore
                targetEl = target;
            }
        } catch (e) {}

        // eslint-disable-next-line eqeqeq
        if (targetEl == null) {
            try {
                targetEl = document.querySelector(`#${target}`);
            } catch (e) {}
        }

        if (targetEl) {
            targetEl.addEventListener('mouseover', open);
            if (!persist) {
                targetEl.addEventListener('mouseleave', close);
            }
        }
    }

    function unregisterEventListeners() {
        if (targetEl) {
            targetEl.removeEventListener('mouseover', open);
            targetEl.removeEventListener('mouseleave', close);
            targetEl.removeAttribute('aria-describedby');
        }

        if (tooltipEl && persist) {
            tooltipEl.removeEventListener("mouseleave", close);
        }
    }

    /** @param {any} e */
    function handleClickOutside(e) {
        e.preventDefault();

        if (!persist) return;

        const curNode = e.detail.currentNode;
        const targetNode = e.detail.targetNode;

        if (!curNode?.contains(targetNode)) {
            isOpen = false;
        }
    }

    $: classes = classnames(
        containerClasses,
        'tooltip',
        `bs-tooltip-${bsPlacement}`,
        animation ? 'fade' : null,
        isOpen ? 'show' : null
    );

    $: {
        if (isOpen && tooltipEl) {
            // @ts-ignore
            popperInstance = createPopper(targetEl, tooltipEl, {
                placement,
                modifiers: [checkPopperPlacement]
            });
        } else if (popperInstance) {
            // @ts-ignore
            popperInstance.destroy();
            // @ts-ignore
            popperInstance = undefined;
        }
    }
    
    $: if (target) {
        unregisterEventListeners();
        registerEventListeners();
    }

    $: if (targetEl) {
        if (isOpen) {
            targetEl.setAttribute('aria-describedby', id);
        } else {
            targetEl.removeAttribute('aria-describedby');
        }
    }

    $: if (persist && tooltipEl) {
        tooltipEl.addEventListener("mouseleave", close);
    }

    $: {
        if (popperPlacement === 'left') {
            bsPlacement = 'start';
        } else if (popperPlacement === 'right') {
            bsPlacement = 'end';
        } else {
            bsPlacement = popperPlacement;
        }
    }
</script>

{#if isOpen}
    <svelte:component this={Portal}>
        <div
            bind:this={tooltipEl}
            use:clickoutsideDirective
            on:clickoutside={handleClickOutside}
            {...$$restProps}
            class={classes}
            {id}
            role="tooltip"
            data-bs-theme={theme}
            data-bs-delay={delay}
            x-placement={popperPlacement}
        >
            <div class="tooltip-arrow" data-popper-arrow></div>
            <div class="tooltip-inner">
                <slot />
            </div>
        </div>
    </svelte:component>
{/if}