export function range(size = 3, startAt = 0) {
    return [...Array(size).keys()].map((i) => i + startAt);
};