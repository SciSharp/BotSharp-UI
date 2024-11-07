<script>

    /** @type {string} */
    export let lang;

    /** @type {string} */
    export let text;


    /** @type {boolean} */
    let copied = false;

    function copyToClipboard() {
        navigator.clipboard.writeText(text).then(() => {
            setTimeout(() => {
                copied = false;
            }, 800);
        });
    }
</script>


<div class="code-block">
    <div class="code-header">
        <div class="line-align-center fw-bold">
            {lang || ''}
        </div>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
            class="line-align-center copy-btn"
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            title="Copy"
            on:mouseup={() => copyToClipboard()}
            on:mousedown={() => copied = true}
        >
            {#if copied}
                <div class="div-center">
                    <div class="line-align-center">
                        <i class="bx bx-check" style="font-size: 18px;" /> 
                    </div>
                    <div class="line-align-center">
                        <span style="font-size: 10px;">{'Copied!'}</span>
                    </div>
                </div>
            {:else}
                <i class="bx bx-copy clickable" />
            {/if}
        </div>
    </div>
    <pre>
        <code class={`language-${lang}`}>
            <div>{text}</div>
        </code>
    </pre>
</div>