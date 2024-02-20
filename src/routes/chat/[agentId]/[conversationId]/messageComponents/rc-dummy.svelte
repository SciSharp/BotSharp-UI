<script>
	import { replaceNewLine } from "$lib/helpers/http";

    /** @type {any} */
    export let message;

    const separator = '|';

    /** @type {string[]} */
    let answers = [];

    let options = [
        {
            title: 'Option 1',
            isClicked: false
        },
        {
            title: 'Option 2',
            isClicked: false,
        },
        {
            title: 'Option 3',
            isClicked: false,
        },
    ];

    /**
	 * @param {any} e
     * @param {number} index
	 */
    function clickOption(e, index) {
        e.preventDefault();
        options = options.map((x, idx) => {
            if (idx === index) {
                x.isClicked = !x.isClicked;
                if (x.isClicked) {
                    answers = [...answers, x.title];
                } else {
                    answers = answers.filter(a => a != x.title);
                }
            }
            return x;
        });

        console.log('answers: ', answers);
    }

    /**
	 * @param {any} e
     * @param {any} message
	 */
    function handleContinue(e, message) {
        e.preventDefault();
        const payload = answers.join(separator);
        console.log(payload);
    }
</script>

<div class="ctext-wrap">
    <div class="flex-shrink-0 align-self-center">
        <div>{@html replaceNewLine(message?.text || '')}</div>
    </div>
</div>

<div class="button-group">
    {#each options as option, index}
    <button class="btn btn-outline-primary btn-rounded btn-sm m-1" class:active={option.isClicked} on:click={(e) => clickOption(e, index)}>{option.title}</button>
    {/each}
    <button class="btn btn-outline-primary btn-rounded btn-sm m-1" disabled={options.every(x => !x.isClicked)} on:click={(e) => handleContinue(e, message)}>{'Continue'}</button>
</div>