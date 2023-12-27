<script>
    import { Button, Card, CardBody, CardTitle} from 'sveltestrap';
    import jsonview from '@pgrabovets/json-view';
    import { onMount } from 'svelte';

    /** @type {import('$types').ConversationModel} */
    export let conversation;    

    onMount(() => {
        // create json tree object
        const tree = jsonview.create(conversation.states);

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