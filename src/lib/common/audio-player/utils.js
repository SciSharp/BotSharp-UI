/**
 * @param {number} second
 */
export function secondToTime(second) {
    const add0 = (/** @type {number} */ num) => (num < 10 ? "0" + num : "" + num);
    const hour = Math.floor(second / 3600);
    const min = Math.floor((second - hour * 3600) / 60);
    const sec = Math.floor(second - hour * 3600 - min * 60);
    return (hour > 0 ? [hour, min, sec] : [min, sec]).map(add0).join(":");
};

/**
 * @param {Record<string, any>} props
 * @param {string} key
 */
export function propsBool(props, key) {
    const v = props[key];
    return !(v === null || v === undefined || v === "false");
}