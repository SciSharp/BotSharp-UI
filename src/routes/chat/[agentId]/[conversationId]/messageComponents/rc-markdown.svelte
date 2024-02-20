<script>
    import { marked } from 'marked';
    import { replaceNewLine } from '$lib/helpers/http';

    // /** @type {import('$types').TextMessage} */
	// export let message;

    /** @type {string} */
	export let message = "The SQL statement to create a new service category named 'DSC Equipment' is: <br /> ```sql INSERT INTO data_ServiceCategory (Name) VALUES ('DSC Equipment');``` <br /> I have executed the query to create the new service category.";
</script>

<div class="ctext-wrap">
	<div class="flex-shrink-0 align-self-center">
        <span>{@html marked(replaceNewLine(message || ''))}</span>
    </div>
</div>