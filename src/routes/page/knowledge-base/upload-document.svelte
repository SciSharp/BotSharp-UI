<script>
    import { _ } from 'svelte-i18n';
    import { uploadKnowledge } from '$lib/services/knowledge-base-service';
    import { Input, Button } from "@sveltestrap/sveltestrap";
    import { KNOWLEDGE_COLLECTION } from '$lib/helpers/constants';

    /** @type {FileList} */
    let files;

	$: if (files) {
		// Note that `files` is of type `FileList`, not an Array:
		// https://developer.mozilla.org/en-US/docs/Web/API/FileList
		console.log(files);

		for (const file of files) {
			console.log(`${file.name}: ${file.size} bytes`);
		}
	}

    async function handleFileUpload() {
        for (const file of files) {
            await uploadKnowledge(KNOWLEDGE_COLLECTION, file);
        }
    }
</script>

<div class="input-group">
    <Input
        type="file"
        bind:files
        class="form-control"
        aria-describedby="inputGroupFileAddon04"
        aria-label="{$_('Upload')}"
    />
    <Button color="primary" id="inputGroupFileAddon04" disabled={!files} on:click={() => handleFileUpload()}>{$_('Upload')}</Button>
</div>
