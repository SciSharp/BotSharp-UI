<script>
	import { Row, Card, CardBody, CardHeader, Container } from '@sveltestrap/sveltestrap';
	import Breadcrumb from '$lib/common/Breadcrumb.svelte';
    import HeadTitle from '$lib/common/HeadTitle.svelte';

	import UploadDocument from "./upload-document.svelte";
	import FileLeftBar from './FileLeftBar.svelte';
	import FileLists from "./FileLists.svelte";
	import RecentFile from "./RecentFile.svelte";
	import Storage from "./Storage.svelte";
	import { _ } from 'svelte-i18n'
</script>
<HeadTitle title="{$_('Knowledge Manager')}" />
<Breadcrumb pagetitle="{$_('Knowledge Manager')}" title="{$_('Knowledge Base')}"/>
<div class="d-xl-flex">
	<div class="w-100">
		<div class="d-md-flex">
			<FileLeftBar />
			<div class="w-100">
				<Card>
					<CardBody>
						<FileLists />
						<div class="mb-3">
							<UploadDocument />
						</div>						
                  		<RecentFile />
					</CardBody>
				</Card>
			</div>
		</div>
	</div>
	<Storage />
</div>
