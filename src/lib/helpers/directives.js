/** @param {any} node */
export function clickoutsideDirective(node) {

    const handleClick = (/** @type {any} */ event) => {
        if (node) {
            node.dispatchEvent(new CustomEvent('clickoutside', {
                detail: {
                    currentNode: node,
                    targetNode: event.target
                }
            }));
        }
    }

    document.addEventListener('click', handleClick, true);

    return {
        destroy() {
            document.removeEventListener('click', handleClick, true);
        }
    };
}