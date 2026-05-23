<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { getUserStore, globalMenuStore } from '$lib/helpers/store';
    import { getCleanUrl } from '$lib/helpers/utils/common';

    let {
        htmlTagId = 'embedding-page',
        slugName = 'embedding-slug',
        label = $bindable('')
    } = $props();

    /** @type {string} */
    let curSlug = $state('');

    /** @type {boolean} */
    let fullScreen = $state(false);

    /** @type {HTMLDivElement | null} */
    let containerEl = $state(null);

    $effect(() => {
        const footer = document.querySelector('.footer');
        const pageContent = document.querySelector('.page-content');

        if (fullScreen) {
            if (footer instanceof HTMLElement) {
                footer.style.display = 'none';
            }
            if (pageContent instanceof HTMLElement) {
                pageContent.style.paddingBottom = '0';
            }
        } else {
            if (footer instanceof HTMLElement) {
                footer.style.display = '';
            }
            if (pageContent instanceof HTMLElement) {
                pageContent.style.paddingBottom = '';
            }
        }

        return () => {
            if (footer instanceof HTMLElement) {
                footer.style.display = '';
            }
            if (pageContent instanceof HTMLElement) {
                pageContent.style.paddingBottom = '';
            }
        };
    });

    /* Measure the container's actual top-offset from the viewport and feed it
       into a `--embedding-top` CSS variable. The page route may render
       arbitrary siblings (e.g. a `<Breadcrumb>`) above the embedding
       container, so a static `calc(100vh - header)` would overshoot. By
       binding the offset reactively, the height stays correct across
       breadcrumb-line-wraps, sidebar collapse, window resize, etc. */
    $effect(() => {
        const el = containerEl;
        if (!el) return;

        const updateOffset = () => {
            const top = el.getBoundingClientRect().top;
            el.style.setProperty('--embedding-top', `${top}px`);
        };

        updateOffset();
        window.addEventListener('resize', updateOffset);

        // Track ancestor size/visibility changes (breadcrumb wrap on
        // viewport-narrow, sidebar toggle, etc.). The observer is cheap
        // because the callback only sets a CSS variable.
        const ro = new ResizeObserver(updateOffset);
        if (el.parentElement) {
            ro.observe(el.parentElement);
        }

        return () => {
            window.removeEventListener('resize', updateOffset);
            ro.disconnect();
        };
    });

    // @ts-ignore
    let slug = $derived($page.params[slugName]);

    $effect(() => {
        const value = slug;
        if (curSlug && curSlug !== value) {
            location.reload();
        }
        curSlug = value;
    });

    onMount(() => {
        const menuUnsubscribe = globalMenuStore.subscribe((/** @type {import('$pluginTypes').PluginMenuDefModel[]} */ menu) => {
            const url = getCleanPath(getPathUrl());
            let found = menu.find(x => getCleanPath(x.link) === url);
            label = found?.label || '';
            if (!found?.embeddingInfo) {
                const subFound = menu.find(x => !!x.subMenu?.find(y => getCleanPath(y.link) === url));
                found = subFound?.subMenu?.find(x => getCleanPath(x.link) === url);
                label = found?.label || '';
            }
            fullScreen = found?.embeddingInfo?.fullScreen || false;
            embed(found?.embeddingInfo || null);
        });

        return () => {
            menuUnsubscribe?.();
        };
    });

    /** @param {import('$pluginTypes').EmbeddingInfoModel?} data */
    function embed(data) {
        if (!data) return;

        if (data.scriptSrc) {
            const script = document.createElement("script");
            script.id = data.source;
            script.src = data.scriptSrc;
            script.async = true;

            if (data.scriptType) {
                script.type = data.scriptType;
            }
            document.head.appendChild(script);
        }

        const div = document.querySelector(`#${htmlTagId}`);
        if (!data.url || !div) return;

        if (data.htmlTag) {
            const elem = document.createElement(data.htmlTag);
            elem.id = data.source;
            elem.style = data.htmlStyle || 'width: 100%; height: 100%; justify-content: center;';

            let url = data.url;
            if (data.appendTokenName) {
                const user = getUserStore();
                url += `${url.includes('?') ? '&' : '?'}${data.appendTokenName}=${user?.token}`;
            }

            // @ts-ignore
            elem.src = url;
            div.appendChild(elem);
        }
    }

    /** @param {string} url */
    const getCleanPath = (url) => {
        return getCleanUrl((url || '').split('?')[0]);
    };

    const getPathUrl = () => {
        return $page.url.pathname || '';
    };
</script>

<div
    bind:this={containerEl}
    id={`${htmlTagId}`}
    class="embedding-container"
    class:embedding-container-fullscreen={fullScreen}
>
</div>

<style>
    /* ============================================================
       Embedding container — owns its own sizing so the embedded
       <iframe> child (which typically uses `height: 100%`/`98%`)
       has a non-collapsing parent.

       The legacy global rule in `_agent.scss` referenced Bootstrap
       SCSS variables ($header-height, $grid-gutter-width,
       $footer-height) that no longer resolve after the Tailwind
       migration, so the iframe collapsed to its 150px default. Now
       the container computes its height from `--embedding-top`
       (the container's actual viewport offset, set at runtime by a
       ResizeObserver) and the `--footer-height` theme token.
       ============================================================ */

    .embedding-container {
        /* Default `--embedding-top` is a sensible fallback for SSR /
           the brief window before the runtime ResizeObserver fires. */
        --embedding-top: calc(var(--header-height) + 1.5rem);

        width: 100%;
        height: calc(100vh - var(--embedding-top) - var(--footer-height));
        padding: 0;
        margin: 0;
        overflow: hidden;
        background-color: rgb(255 255 255);
        border-radius: 0.5rem;
    }

    /* Fullscreen mode: the component's $effect hides the page
       footer and zeroes the page-content's `padding-bottom`, so the
       container can extend down to the viewport edge. */
    .embedding-container.embedding-container-fullscreen {
        height: calc(100vh - var(--embedding-top));
        border-radius: 0;
    }

    /* The embed() function injects a single child element whose tag
       name comes from the plugin config (typically <iframe>, but
       <embed>, <object>, <video>, etc. are all valid). The universal
       `> *` selector future-proofs the rule against any tag name; the
       container's contract is "exactly one runtime-injected child",
       so there's nothing else inside to accidentally match.

       Note: `width`/`height` here are defaults — plugins may set their
       own inline width/height (e.g. `height: 98%`) which will win via
       standard CSS specificity. `display: block` and `border: 0` apply
       universally regardless. */
    .embedding-container :global(> *) {
        display: block;
        width: 100%;
        height: 100%;
        border: 0;
    }
</style>