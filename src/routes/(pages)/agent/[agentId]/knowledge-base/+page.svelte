<script>
	import { Button, Card, CardBody, CardHeader, CardTitle, Col, Input, Label, Row } from 'sveltestrap';
    import Breadcrumb from '$lib/common/Breadcrumb.svelte';
    import HeadTitle from '$lib/common/HeadTitle.svelte';    

    let files;

	$: if (files) {
		// Note that `files` is of type `FileList`, not an Array:
		// https://developer.mozilla.org/en-US/docs/Web/API/FileList
		console.log(files);

		for (const file of files) {
			console.log(`${file.name}: ${file.size} bytes`);
		}
	}
</script>

<HeadTitle title="Agent Knowledge Base" />
<Breadcrumb title="Agent" pagetitle="Knowledge Base" />

<Card>
    <CardHeader>
        <p>Upload your own document, BotSharp will convert this data into its knowledges.</p>
    </CardHeader>
    <CardBody>
        <div class="input-group">
            <Input
                type="file"
                bind:files
                class="form-control"
                id="inputGroupFile04"
                aria-describedby="inputGroupFileAddon04"
                aria-label="Upload"
            />
            <Button color="primary" type="button" id="inputGroupFileAddon04">Upload</Button>
        </div>
    </CardBody>
</Card>
