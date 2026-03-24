<script>
    let {
        /** @type {string} */
        lang = '',
        /** @type {string} */
        text = ''
    } = $props();

    let copied = $state(false);

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
        <div
            class="line-align-center copy-btn"
            role="button"
            tabindex="0"
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            title="Copy"
            onmouseup={() => copyToClipboard()}
            onmousedown={() => copied = true}
        >
            {#if copied}
                <div class="div-center">
                    <div class="line-align-center">
                        <i class="bx bx-check" style="font-size: 18px;"></i>
                    </div>
                    <div class="line-align-center">
                        <span style="font-size: 10px;">{'Copied!'}</span>
                    </div>
                </div>
            {:else}
                <i class="bx bx-copy clickable"></i>
            {/if}
        </div>
    </div>
    <pre>
        <code class={`language-${lang}`}>
            <div>{text}</div>
        </code>
    </pre>
</div>