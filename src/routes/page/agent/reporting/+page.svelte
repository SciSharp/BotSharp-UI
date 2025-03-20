<script>
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import { _ } from 'svelte-i18n';
    import { Card, CardBody, Col, Row } from '@sveltestrap/sveltestrap';
	import HeadTitle from "$lib/common/HeadTitle.svelte";
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
	import { globalMenuStore } from '$lib/helpers/store';

    /** @type {any} */
    let unsubscriber;

    onMount(async () => {
        unsubscriber = globalMenuStore.subscribe((/** @type {import('$pluginTypes').PluginMenuDefModel[]} */ menu) => {
            const url = getPathUrl();
            let data = menu.find(x => x.link === url)?.embeddingInfo || null;
            if (!data) {
                const found = menu.find(x => !!x.subMenu?.find(y => y.link === url));
                data = found?.subMenu?.find(x => x.link === url)?.embeddingInfo || null;
            }
            embed(data);
        });
    });

    onDestroy(() => {
        unsubscriber?.();
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

        const div = document.querySelector('#agent-reporting-content');
        if (!data.url || !div) return;

        if (data.htmlTag) {
            const elem = document.createElement(data.htmlTag);
            elem.id = data.source;
            elem.style.width = '100%';
            elem.style.height = '100%';
            elem.style.justifyContent = 'center';
            // @ts-ignore
            elem.src = data.url;
            div.appendChild(elem);
        }
    }

    const getPathUrl = () => {
		const path = $page.url.pathname;
		return path?.startsWith('/') ? path.substring(1) : path;
	};
</script>

<HeadTitle title="{$_('Reporting')}" />
<Breadcrumb title="{$_('Agent')}" pagetitle="{$_('Reporting')}" />

<Row>
	<Col lg="12">
		<Card>
			<CardBody id="agent-reporting-content"></CardBody>
        </Card>
    </Col>
</Row>