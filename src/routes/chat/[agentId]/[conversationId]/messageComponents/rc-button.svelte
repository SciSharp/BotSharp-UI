<script>
	import { replaceNewLine } from "$lib/helpers/http";

    export let text = '';
</script>


<span>{@html replaceNewLine(text)}</span>