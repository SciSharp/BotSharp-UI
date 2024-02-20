<script>
	import { replaceNewLine } from "$lib/helpers/http";

    export let text = '';
</script>

<div class="ctext-wrap">
    <div class="flex-shrink-0 align-self-center">
        <div>{@html replaceNewLine(text)}</div>
    </div>
</div>

<button class="btn btn-outline-primary btn-rounded btn-sm m-1">{"Option 1"}</button>
<button class="btn btn-outline-primary btn-rounded btn-sm m-1">{"Option 2"}</button>
<button class="btn btn-outline-primary btn-rounded btn-sm m-1">{"Option 3"}</button>