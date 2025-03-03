<script>
    import { onMount } from 'svelte';
    import { Card, CardBody, CardTitle} from '@sveltestrap/sveltestrap';
    import jsonview from '@pgrabovets/json-view';
	import { formatObject } from '$lib/helpers/utils/common';

    /** @type {import('$conversationTypes').ConversationModel} */
    export let conversation;    

    onMount(() => {
        // create json tree object
        const tree = jsonview.create(formatObject(conversation.states));

        // render tree into dom element
        jsonview.render(tree, document.querySelector('#conversationStates'));
        jsonview.expand(tree);
    });    
</script>

<Card>
    <CardBody>
        <CardTitle class="mb-5 h4">States</CardTitle>
        <div id="conversationStates"></div>
    </CardBody>
</Card>