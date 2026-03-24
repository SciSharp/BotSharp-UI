<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { getUserStore, globalMenuStore } from '$lib/helpers/store';

    let {
        htmlTagId = 'embedding-page',
        slugName = 'embedding-slug',
        label = $bindable('')
    } = $props();

    /** @type {string} */
    let curSlug = $state('');

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
            const url = getPathUrl();
            let found = menu.find(x => x.link === url);
            label = found?.label || '';
            if (!found?.embeddingInfo) {
                const subFound = menu.find(x => !!x.subMenu?.find(y => y.link === url));
                found = subFound?.subMenu?.find(x => x.link === url);
                label = found?.label || '';
            }
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

    const getPathUrl = () => {
        const path = $page.url.pathname;
        return path?.startsWith('/') ? path.substring(1) : path;
    };
</script>

<div
    id={`${htmlTagId}`}
    class="embedding-container"
>
</div>