<script>
    import { onMount } from 'svelte';
    import jsonview from '@pgrabovets/json-view';
	import { formatObject } from '$lib/helpers/utils/common';

    /** @type {{ conversation: import('$conversationTypes').ConversationModel }} */
    let { conversation } = $props();

    onMount(() => {
        // create json tree object
        const tree = jsonview.create(formatObject(conversation.states));

        // render tree into dom element
        jsonview.render(tree, document.querySelector('#conversationStates'));
        jsonview.expand(tree);
    });
</script>

<div class="card">
    <div class="card-body">
        <h4 class="card-title mb-5">States</h4>
        <div id="conversationStates"></div>
    </div>
</div>