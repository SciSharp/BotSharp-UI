<script>
    let {
        text = "",
        className = "",
        style = "",
        color = "primary",
        ellipsis = false,
        /** @type {string | number} */
        index,
        /** @type {(args0: number | string) => void} */
        onClose = () => {}
    } = $props();

    /**
	 * @param {any} e
	 * @param {string | number} idx
	 */
    function handleClose(e, idx) {
        e.preventDefault();
        onClose?.(idx);
    }
</script>

<div class={`label-container ${className}`} style={`${style}`}>
    <button class={`btn btn-${color} btn-sm label-btn`}>
        <div style="display: flex;">
            <span class={`me-2 label-text ${ellipsis ? 'label-ellipsis' : 'd-none d-sm-inline-block'}`}>
                {text}
            </span>
            <i
                class="mdi mdi-window-close label-close"
                role="button"
                tabindex="0"
                onkeydown={() => {}}
                onclick={(e) => handleClose(e, index)}
            >
            </i>
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

    .label-ellipsis {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 120px;
    }

    .label-close {
        cursor: pointer;
        display: flex;
        align-items: center;
    }
</style>