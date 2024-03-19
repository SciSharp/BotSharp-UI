/** @param {any} node */
export function clientOutSide(node) {

    const handleClick = (/** @type {any} */ event) => {
        if (!!node && !node.contains(event.target)) {
            node.dispatchEvent(new CustomEvent('clickOutSide', node));
        }
    }

    document.addEventListener('click', handleClick, true);

    return {
        destroy() {
            document.removeEventListener('click', handleClick, true);
        }
    };
}