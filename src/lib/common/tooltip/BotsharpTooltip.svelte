<script>
    import { onMount, onDestroy } from 'svelte';
    import { createPopper } from '@popperjs/core';
    import { v4 as uuidv4 } from 'uuid';
    import { classnames } from '$lib/helpers/utils/common';
    import { clickoutsideDirective } from "$lib/helpers/directives";

    let {
        containerClasses = '',
        animation = true,
        id = `tooltip_${uuidv4()}`,
        isOpen = $bindable(false),
        persist = false,
        placement = 'top',
        target = '',
        theme = null,
        delay = 0,
        style = '',
        children
    } = $props();

    /** @type {string} */
    let bsPlacement = $state('start');
    /** @type {object | undefined} */
    let popperInstance;
    // svelte-ignore state_referenced_locally
    /** @type {string} */
    let popperPlacement = $state(placement);
    /** @type {HTMLDivElement | null} */
    let targetEl = $state(null);
    /** @type {HTMLDivElement | null} */
    let tooltipEl = $state(null);
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

    let classes = $derived(classnames(
        containerClasses,
        'tooltip',
        `bs-tooltip-${bsPlacement}`,
        animation ? 'fade' : null,
        isOpen ? 'show' : null
    ));

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
            // @ts-ignore
            if (target instanceof HTMLElement) {
                // @ts-ignore
                targetEl = target;
            }
        } catch (e) {
            console.log(e);
        }

        // eslint-disable-next-line eqeqeq
        if (targetEl == null) {
            try {
                targetEl = document.querySelector(`#${target}`);
            } catch (e) {
                console.log(e);
            }
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

    $effect(() => {
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
    });

    $effect(() => {
        if (target) {
            unregisterEventListeners();
            registerEventListeners();
        }
    });

    $effect(() => {
        if (targetEl) {
            if (isOpen) {
                targetEl.setAttribute('aria-describedby', id);
            } else {
                targetEl.removeAttribute('aria-describedby');
            }
        }
    });

    $effect(() => {
        if (persist && tooltipEl) {
            tooltipEl.addEventListener("mouseleave", close);
        }
    });

    $effect(() => {
        if (popperPlacement === 'left') {
            bsPlacement = 'start';
        } else if (popperPlacement === 'right') {
            bsPlacement = 'end';
        } else {
            bsPlacement = popperPlacement;
        }
    });

    // Portal behavior: move tooltip to document.body to avoid clipping
    $effect(() => {
        if (tooltipEl && isOpen) {
            document.body.appendChild(tooltipEl);

            return () => {
                if (tooltipEl?.parentNode === document.body) {
                    document.body.removeChild(tooltipEl);
                }
            };
        }
    });
</script>

{#if isOpen}
    <div
        bind:this={tooltipEl}
        use:clickoutsideDirective
        onclickoutside={handleClickOutside}
        {style}
        class={classes}
        {id}
        role="tooltip"
        data-bs-theme={theme}
        data-bs-delay={delay}
        x-placement={popperPlacement}
    >
        <div class="tooltip-arrow" data-popper-arrow></div>
        <div class="tooltip-inner">
            {@render children?.()}
        </div>
    </div>
{/if}