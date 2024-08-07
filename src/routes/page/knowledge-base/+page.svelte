<script>
	import { Card, CardBody } from '@sveltestrap/sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
    import HeadTitle from '$lib/common/HeadTitle.svelte';
	import KnowledgeList from "./KnowledgeList.svelte";
	import { _ } from 'svelte-i18n'
</script>

<HeadTitle title="{$_('Knowledge Manager')}" />
<Breadcrumb pagetitle="{$_('Knowledge Manager')}" title="{$_('Knowledge Base')}"/>

<div class="d-xl-flex">
	<div class="w-100">
		<div class="d-md-flex">
			<!-- <FileLeftBar /> -->
			<div class="w-100">
				<Card>
					<CardBody>
                  		<KnowledgeList />
					</CardBody>
				</Card>
			</div>
		</div>
	</div>
</div>