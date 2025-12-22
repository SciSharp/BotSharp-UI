<script>
    import { onMount, onDestroy } from 'svelte';
    import { derived } from 'svelte/store';
    import { page } from '$app/stores';
    import { _ } from 'svelte-i18n';
    import { Card, CardBody, Col, Row } from '@sveltestrap/sveltestrap';
	import { getUserStore, globalMenuStore } from '$lib/helpers/store';
	
    /** @type {string} */
    export let htmlTagId = 'embedding-page';

    /** @type {string} */
    export let slugName = 'embedding-slug';

    /** @type {string?} */
    export let label = '';

    /** @type {any} */
    let menuUnsubscribe;

    /** @type {string} */
    let curSlug = '';

    const slug = derived(page, $page => $page.params[slugName]);

    const contentSubscribe = slug.subscribe(value => {
        if (curSlug && curSlug !== value) {
            location.reload();
        }
        curSlug = value;
    });

    onMount(async () => {
        menuUnsubscribe = globalMenuStore.subscribe((/** @type {import('$pluginTypes').PluginMenuDefModel[]} */ menu) => {
            const url = getPathUrl();
            let found = menu.find(x => x.link === url);
            label = found?.label || null;
            if (!found?.embeddingInfo) {
                const subFound = menu.find(x => !!x.subMenu?.find(y => y.link === url));
                found = subFound?.subMenu?.find(x => x.link === url);
                label = found?.label || null;
            }
            embed(found?.embeddingInfo || null);
        });
    });

    onDestroy(() => {
        menuUnsubscribe?.();
        contentSubscribe?.();
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

<Row>
	<Col lg="12">
		<Card>
			<CardBody
                id={`${htmlTagId}`}
                style="padding: 0px; height: calc(100vh - 230px);"
            >
            </CardBody>
        </Card>
    </Col>
</Row>