class LocalStorageManager {
    /**
     * @param {{ maxSize?: number, overflowStrategy?: 'LRU' | 'EXPIRE_FIRST' }} options
     */
    constructor(options = {}) {
        this.maxSize = options.maxSize || 4 * 1024 * 1024;
        this.overflowStrategy = options.overflowStrategy || 'EXPIRE_FIRST';
    }

    /**
     * @param {string} key
     * @param {any} value
     * @param {number | null} ttl
     */
    set(key, value, ttl = null) {
        try {
            const item = {
                value,
                meta: {
                    expire: ttl ? Date.now() + ttl : null,
                    lastAccess: Date.now()
                }
            };

            const cost = this._calculateItemCost(key, JSON.stringify(item));

            if (cost > this.maxSize) throw new Error('Item exceeds maximum storage size');

            if (this._getTotalSize() + cost > this.maxSize) {
                this._performCleanup(cost);
            }

            if (this._getTotalSize() + cost > this.maxSize) throw new Error('Item exceeds maximum storage size');

            localStorage.setItem(key, JSON.stringify(item));
            this._updateSizeCache(cost);
        } catch (/** @type {any} */ error) {
            console.error('Storage Error:', error);
        }
    }

    /**
     * @param {string} key
     * @returns {any}
     */
    get(key) {
        const raw = localStorage.getItem(key);
        if (!raw) return null;

        const item = JSON.parse(raw);
        if (this._isExpired(item)) {
            this.remove(key);
            return null;
        }

        item.meta.lastAccess = Date.now();
        localStorage.setItem(key, JSON.stringify(item));
        return item.value;
    }

    /**
     * @param {string} key
     */
    remove(key) {
        const raw = localStorage.getItem(key);
        localStorage.removeItem(key);
        if (raw) this._updateSizeCache(-this._calculateItemCost(key, raw));
    }

    clear() {
        localStorage.clear();
        this._sizeCache = 0;
    }

    /**
     * @param {any} item
     * @returns {boolean}
     */
    _isExpired(item) {
        return item && item.meta && item.meta.expire && item.meta.expire < Date.now();
    }

    /**
     * @param {string} key
     * @param {string} valueString
     * @returns {number}
     */
    _calculateItemCost(key, valueString) {
        const encoder = new TextEncoder();
        return encoder.encode(key).length + encoder.encode(valueString).length;
    }

    _getTotalSize() {
        if (!this._sizeCache) this._rebuildSizeCache();
        return this._sizeCache;
    }

    _rebuildSizeCache() {
        this._sizeCache = Array.from({ length: localStorage.length })
            .reduce((total, _, i) => {
                const key = localStorage.key(i);
                const item = key ? localStorage.getItem(key) : null;
                return total + (key && item ? this._calculateItemCost(key, item) : 0);
            }, 0);
    }

    /**
     * @param {number} delta
     */
    _updateSizeCache(delta) {
        this._sizeCache = (this._sizeCache || 0) + delta;
    }

    /**
     * @param {number} requiredSpace
     */
    _performCleanup(requiredSpace) {
        const /** @type {any[]} */ candidates = [];

        Array.from({ length: localStorage.length }).forEach((_, i) => {
            const key = localStorage.key(i);
            const raw = key ? localStorage.getItem(key) : null;
            if (!key || !raw) {
                return;
            }  
            const item = JSON.parse(raw);
            if (item && item.meta) {
                candidates.push({
                    key,
                    size: this._calculateItemCost(key, raw),
                    expire: item.meta.expire || Infinity,
                    lastAccess: item.meta.lastAccess
                });
            }
        });

        switch (this.overflowStrategy) {
            case 'EXPIRE_FIRST':
                candidates.sort((a, b) => a.expire - b.expire);
                break;
            case 'LRU':
                candidates.sort((a, b) => a.lastAccess - b.lastAccess);
                break;
        }

        let freedSpace = 0;
        while (freedSpace < requiredSpace && candidates.length > 0) {
            const target = candidates.shift();
            this.remove(target.key);
            freedSpace += target.size;
        }
    }
}

export default LocalStorageManager;