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

    let placementCategory = $derived(
        popperPlacement?.startsWith('bottom') ? 'bottom'
            : popperPlacement?.startsWith('left') ? 'left'
            : popperPlacement?.startsWith('right') ? 'right'
            : 'top'
    );

    let classes = $derived(classnames(
        containerClasses,
        'tooltip',
        `tooltip-${placementCategory}`,
        'absolute z-50 m-0 block font-sans text-sm not-italic leading-normal text-left no-underline whitespace-normal break-words',
        isOpen ? 'opacity-90' : 'opacity-0',
        animation ? 'transition-opacity duration-150 ease-linear' : null
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
        <div class="tooltip-arrow absolute block" data-popper-arrow></div>
        <div class="tooltip-inner max-w-[200px] rounded bg-gray-900 px-2 py-1 text-center text-white">
            {@render children?.()}
        </div>
    </div>
{/if}

<style>
    /* Placement-aware arrow geometry. The arrow element itself is positioned
       by Popper via `data-popper-arrow`; these rules only define its size and
       the colored triangle (via ::before) for each placement category. */
    .tooltip-arrow {
        width: 0.8rem;
        height: 0.4rem;
    }
    .tooltip-arrow::before {
        position: absolute;
        content: '';
        border-color: transparent;
        border-style: solid;
    }

    .tooltip-top .tooltip-arrow { bottom: 0; }
    .tooltip-top .tooltip-arrow::before {
        top: -1px;
        border-width: 0.4rem 0.4rem 0;
        border-top-color: var(--color-gray-900, rgb(17 24 39));
    }

    .tooltip-bottom .tooltip-arrow { top: 0; }
    .tooltip-bottom .tooltip-arrow::before {
        bottom: -1px;
        border-width: 0 0.4rem 0.4rem;
        border-bottom-color: var(--color-gray-900, rgb(17 24 39));
    }

    .tooltip-left .tooltip-arrow {
        right: 0;
        width: 0.4rem;
        height: 0.8rem;
    }
    .tooltip-left .tooltip-arrow::before {
        right: -1px;
        border-width: 0.4rem 0 0.4rem 0.4rem;
        border-left-color: var(--color-gray-900, rgb(17 24 39));
    }

    .tooltip-right .tooltip-arrow {
        left: 0;
        width: 0.4rem;
        height: 0.8rem;
    }
    .tooltip-right .tooltip-arrow::before {
        left: -1px;
        border-width: 0.4rem 0.4rem 0.4rem 0;
        border-right-color: var(--color-gray-900, rgb(17 24 39));
    }
</style>