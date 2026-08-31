<script>
    import { onMount, tick } from 'svelte';
    import { page } from '$app/state';
    import moment from 'moment';
    import { v4 as uuidv4 } from 'uuid';
    import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import { getContentLogs, getStateLogs } from '$lib/services/logging-service';
    import NavBar from '$lib/common/nav-bar/NavBar.svelte';
    import NavItem from '$lib/common/nav-bar/NavItem.svelte';
    import ContentLogElement from './content-log-element.svelte';
	import ConversationStateLogElement from './conversation-state-log-element.svelte';

    const contentLogTab = 1;
    const conversationStateLogTab = 2;
    const conversationId = page.params.conversationId;
    const utcNow = moment.utc().toDate();

    const scrollbarElements = [
        {
            id: '.content-log-scrollbar',
            type: contentLogTab,
        },
        {
            id: '.conv-state-log-scrollbar',
            type: conversationStateLogTab,
        }
    ];

    /**
     * @type {{
     *   contentLogs?: import('$conversationTypes').ConversationContentLogModel[],
     *   convStateLogs?: import('$conversationTypes').ConversationStateLogModel[],
     *   autoScroll?: boolean,
     *   isWaiting?: boolean,
     *   closeWindow: () => void,
     *   cleanScreen: () => void
     * }}
     */
    let {
        contentLogs = $bindable([]),
        convStateLogs = $bindable([]),
        autoScroll = $bindable(false),
        isWaiting = false,
        closeWindow,
        cleanScreen
    } = $props();

    /** @type {any[]} */
    let scrollbars = [];
    /** @type {number} */
    let selectedTab = $state(contentLogTab);

    /*
     * Same rule as the chat thread: incoming log entries never move a panel on
     * their own. A panel follows the tail only while the user asked it to — by
     * pressing its jump button — and scrolling away from the bottom cancels that.
     * Indexes match `scrollbarElements`: 0 = content log, 1 = conversation states.
     */
    const BOTTOM_THRESHOLD_PX = 60;
    let isPinnedToBottom = $state([true, true]);
    let followTail = $state([false, false]);

    let activeIndex = $derived(selectedTab === contentLogTab ? 0 : 1);
    let showJumpButton = $derived(!isPinnedToBottom[activeIndex]);

    /** @type {import('$conversationTypes').ConversationLogFilter} */
    let contentLogFilter = { size: 100, startTime: utcNow };
    /** @type {import('$conversationTypes').ConversationLogFilter} */
    let stateLogFilter = { size: 100, startTime: utcNow };

    const options = {
		scrollbars: {
			visibility: 'auto',
			autoHide: 'move',
			autoHideDelay: 100,
			dragScroll: true,
			clickScroll: false,
			theme: 'os-theme-light',
			pointers: ['mouse', 'touch', 'pen']
		}
	};

    onMount(() => {
        // Load history, wait for Svelte to flush the new list items to the
        // DOM, then attach OverlayScrollbars and pin to the bottom. Without
        // the tick() wait, scrollHeight is read before the rows render and
        // the viewport ends up parked at the top.
        (async () => {
            await Promise.all([getChatContentLogs(), getChatStateLogs()]);
            await tick();
            initScrollbars();
            trackBottomProximity();
            pinToBottomWhileSettling();
        })();

        return () => {
            cleanLogs();
        };
	});

    $effect(() => {
        // Re-run whenever autoScroll or logs change. Only panels the user put in
        // follow mode are moved; the rest stay where they were left.
        contentLogs;
        convStateLogs;
        if (autoScroll) {
            followTail.forEach((following, idx) => {
                if (following) {
                    scroll(false, idx);
                }
            });
        }
    });

    /** Keep `isPinnedToBottom` in step with where the user has scrolled each panel. */
    function trackBottomProximity() {
        scrollbars.forEach((scrollbar, idx) => {
            if (!scrollbar) return;

            const { viewport } = scrollbar.elements();
            const update = () => {
                const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
                const atBottom = distanceFromBottom <= BOTTOM_THRESHOLD_PX;
                isPinnedToBottom[idx] = atBottom;
                if (!atBottom) {
                    followTail[idx] = false;
                }
            };
            update();
            viewport.addEventListener('scroll', update, { passive: true });
            // Growing content moves the bottom away without firing a scroll event, so
            // the button would stay hidden while the tail slips out of reach.
            new ResizeObserver(update).observe(viewport.firstElementChild || viewport);
        });
    }

    let _scrollScheduled = false;
    /**
     * @param {boolean} goToTop
     * @param {number | null} index Panel to scroll, or null for every panel.
     */
    function scroll(goToTop = false, index = null) {
        if (_scrollScheduled) {
            return;
        }
        _scrollScheduled = true;
        requestAnimationFrame(() => {
            setTimeout(() => {
                // @ts-ignore
                scrollbars.forEach((scrollbar, idx) => {
                    if (index !== null && idx !== index) return;

                    const { viewport } = scrollbar.elements();
                    viewport.scrollTo({ top: goToTop ? 0 : viewport.scrollHeight, behavior: 'smooth' });
                    if (!goToTop) {
                        isPinnedToBottom[idx] = true;
                    }
                });
                _scrollScheduled = false;
            }, 150);
        });
    }

    /** The jump button: go to the tail of the visible panel and follow it from there. */
    function jumpToBottom() {
        followTail[activeIndex] = true;
        scroll(false, activeIndex);
    }

    /**
     * Keep each log panel pinned to the very bottom while the initial layout
     * settles. Async content can grow the row heights after first paint, so a
     * fixed delay isn't enough — a ResizeObserver re-pins on every height change
     * using instant `scrollTop` writes (no animation, no visible scroll).
     * Pinning stops as soon as the user interacts with a panel, or after a
     * safety timeout, so it never fights manual scrolling.
     * @param {number} timeoutMs
     */
    function pinToBottomWhileSettling(timeoutMs = 3000) {
        scrollbars.forEach(scrollbar => {
            if (!scrollbar) return;

            const { viewport } = scrollbar.elements();
            const content = viewport.firstElementChild || viewport;
            const pin = () => { viewport.scrollTop = viewport.scrollHeight; };
            pin();

            const observer = new ResizeObserver(pin);
            observer.observe(content);

            /** @type {ReturnType<typeof setTimeout>} */
            let timer;
            const stop = () => {
                observer.disconnect();
                clearTimeout(timer);
                viewport.removeEventListener('wheel', stop);
                viewport.removeEventListener('pointerdown', stop);
                viewport.removeEventListener('keydown', stop);
            };
            viewport.addEventListener('wheel', stop, { passive: true });
            viewport.addEventListener('pointerdown', stop);
            viewport.addEventListener('keydown', stop);
            timer = setTimeout(stop, timeoutMs);
        });
    }

    function initScrollbars() {
        scrollbarElements.forEach(item => {
            const elem = document.querySelector(item.id);
            if (!elem) return;

            // @ts-ignore
            const scrollbar = OverlayScrollbars(elem, options);
            scrollbars = [ ...scrollbars, scrollbar];
        });
    }

    async function getChatContentLogs() {
        if (!contentLogFilter.startTime) return;

        // @ts-ignore
        const pagedContentLogs = await getContentLogs(conversationId, contentLogFilter);
        contentLogFilter = {
            ...contentLogFilter,
            startTime: pagedContentLogs.nextTime || null
        };
        const newLogs = pagedContentLogs.items?.map(x => {
            return { uid: uuidv4(), ...x };
        }) || [];

        if (newLogs.length > 0) {
            contentLogs = [...newLogs, ...contentLogs];
        }
    }

    async function getChatStateLogs() {
        if (!stateLogFilter.startTime) return;

        // @ts-ignore
        const pagedStateLogs = await getStateLogs(conversationId, stateLogFilter);
        stateLogFilter = {
            ...stateLogFilter,
            startTime: pagedStateLogs.nextTime || null
        };
        const newLogs = pagedStateLogs.items?.map(x => {
            return { uid: uuidv4(), ...x };
        }) || [];

        if (newLogs.length > 0) {
            convStateLogs = [...newLogs, ...convStateLogs];
        }
    }
    
    function cleanLogs() {
        contentLogs = [];
        convStateLogs = [];
    }

    function handleCleanScreen() {
        cleanLogs();
        cleanScreen?.();
    }
    
    /** @param {number} selected */
    function handleTabClick(selected) {
        if (selectedTab === selected) {
            return;
        }
        selectedTab = selected;
    }

    async function goToTopLog() {
        scroll(true);
        if (selectedTab === contentLogTab) {
            await getChatContentLogs();
        } else if (selectedTab === conversationStateLogTab) {
            await getChatStateLogs();
        }
    }
</script>


<div class="pl-root font-code">
    <div class="pl-card">
        <div class="pl-header-bar">
            <div>
                <button
                    type="button"
                    class="pl-action-btn pl-action-btn-secondary"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Clean log"
                    onclick={() => handleCleanScreen()}
                >
                    <i class="bx bx-trash"></i>
                </button>
            </div>
            <div class="pl-action-group">
                <button
                    type="button"
                    class="pl-action-btn pl-action-btn-primary"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Scroll to top"
                    onclick={() => goToTopLog()}
                >
                    <i class="mdi mdi-chevron-double-up"></i>
                </button>
                <button
                    type="button"
                    class="pl-action-btn pl-action-btn-light"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Scroll to bottom"
                    onclick={() => jumpToBottom()}
                >
                    <i class="mdi mdi-chevron-double-down"></i>
                </button>
            </div>
            <div>
                <button
                    type="button"
                    class="pl-action-btn pl-action-btn-secondary"
                    aria-label="Close log window"
                    onclick={() => closeWindow()}
                >
                    <i class="mdi mdi-window-close"></i>
                </button>
            </div>
        </div>

        <div class="pl-scroll-area content-log-scrollbar" class:pl-hide={selectedTab !== contentLogTab}>
            <ul class="pl-list">
                {#each contentLogs as log (log.uid)}
                    <ContentLogElement data={log} />
                {/each}
            </ul>

            <!--
                Sticky, zero-height strip: the button floats over the last entries
                instead of taking a row at the end of the list. Dots while a turn is
                still running (more entries are coming), an arrow once it is done —
                clickable in both states, and clicking also resumes following.
            -->
            <div class="pl-jump-strip">
                {#if showJumpButton}
                    <button
                        type="button"
                        class="pl-jump-btn"
                        class:pl-jump-btn-waiting={isWaiting}
                        aria-label={isWaiting ? 'Waiting for more log entries; scroll to bottom' : 'Scroll to latest log entry'}
                        title={isWaiting ? 'Waiting for more entries' : 'Scroll to latest'}
                        onclick={() => jumpToBottom()}
                    >
                        {#if isWaiting}
                            <span class="pl-jump-dots" aria-hidden="true">
                                <span></span><span></span><span></span>
                            </span>
                        {:else}
                            <i class="mdi mdi-chevron-down"></i>
                        {/if}
                    </button>
                {/if}
            </div>
        </div>

        <div class="pl-scroll-area conv-state-log-scrollbar" class:pl-hide={selectedTab !== conversationStateLogTab}>
            <ul class="pl-list">
                {#each convStateLogs as log (log.uid)}
                    <ConversationStateLogElement data={log} />
                {/each}
            </ul>

            <!--
                Sticky, zero-height strip: the button floats over the last entries
                instead of taking a row at the end of the list. Dots while a turn is
                still running (more entries are coming), an arrow once it is done —
                clickable in both states, and clicking also resumes following.
            -->
            <div class="pl-jump-strip">
                {#if showJumpButton}
                    <button
                        type="button"
                        class="pl-jump-btn"
                        class:pl-jump-btn-waiting={isWaiting}
                        aria-label={isWaiting ? 'Waiting for more log entries; scroll to bottom' : 'Scroll to latest log entry'}
                        title={isWaiting ? 'Waiting for more entries' : 'Scroll to latest'}
                        onclick={() => jumpToBottom()}
                    >
                        {#if isWaiting}
                            <span class="pl-jump-dots" aria-hidden="true">
                                <span></span><span></span><span></span>
                            </span>
                        {:else}
                            <i class="mdi mdi-chevron-down"></i>
                        {/if}
                    </button>
                {/if}
            </div>
        </div>

        <div class="pl-footer">
            <NavBar id={'persist-log-container'}>
                <NavItem
                    navBtnId={'content-log-tab'}
                    navBtnStyles={'font-size: 0.75em;'}
                    dataBsTarget={'#content-log-tab-pane'}
                    ariaControls={'content-log-tab-pane'}
                    navBtnText={'Content Log'}
                    disabled={selectedTab === contentLogTab}
                    active={selectedTab === contentLogTab}
                    onClick={() => handleTabClick(contentLogTab)}
                />
                <NavItem
                    navBtnId={'conv-state-log-tab'}
                    navBtnStyles={'font-size: 0.75em;'}
                    dataBsTarget={'#conv-state-log-tab-pane'}
                    ariaControls={'conv-state-log-tab-pane'}
                    navBtnText={'Conversation States'}
                    disabled={selectedTab === conversationStateLogTab}
                    active={selectedTab === conversationStateLogTab}
                    onClick={() => handleTabClick(conversationStateLogTab)}
                />
            </NavBar>
        </div>
    </div>
</div>

