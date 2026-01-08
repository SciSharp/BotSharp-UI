<script>

    /** @type {string} */
    export let text = "";
    export let className = "";
    export let style = "";
    /** @type {string | number} */
    export let index;
    /** @type {(args0: number | string) => void} */
    export let onClose = () => {};

    /**
	 * @param {any} e
	 * @param {string | number} index
	 */
    function handleClose(e, index) {
        e.preventDefault();
        onClose && onClose(index);
    }
</script>

<div class={`label-container ${className}`} style={`${style}`}>
    <button class="btn btn-primary btn-sm label-btn">
        <div style="display: flex;">
            <span class="d-none d-sm-inline-block me-2 label-text">
                {text}
            </span>
            <i
                class="mdi mdi-window-close label-close"
                role="button"
                tabindex="0"
                on:keydown={() => {}}
                on:click={(e) => handleClose(e, index)}
            />
        </div>
    </button>
</div>


<style>
    .label-container {
        display: inline-block;
        margin-top: 10px;
        margin-bottom: 10px;
        margin-right: 5px;
    }

    .label-btn {
        cursor: default;
        font-size: 12px;
        border-radius: 15px;
    }

    .label-text {
        text-align: left;
    }

    .label-close {
        cursor: pointer;
        display: flex;
        align-items: center;
    }
</style>