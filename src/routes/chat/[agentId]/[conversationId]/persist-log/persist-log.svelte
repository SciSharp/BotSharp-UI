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
     *   closeWindow: () => void,
     *   cleanScreen: () => void
     * }}
     */
    let {
        contentLogs = $bindable([]),
        convStateLogs = $bindable([]),
        autoScroll = $bindable(false),
        closeWindow,
        cleanScreen
    } = $props();

    /** @type {any[]} */
    let scrollbars = [];
    /** @type {number} */
    let selectedTab = $state(contentLogTab);

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
        // DOM, then attach OverlayScrollbars and scroll to bottom. Without
        // the tick() wait, scrollHeight is read before the rows render and
        // the viewport ends up parked at the top.
        (async () => {
            await Promise.all([getChatContentLogs(), getChatStateLogs()]);
            await tick();
            initScrollbars();
            scroll();
        })();

        return () => {
            cleanLogs();
        };
	});

    $effect(() => {
        // Re-run whenever autoScroll or logs change
        contentLogs;
        convStateLogs;
        if (autoScroll) {
            scroll();
        }
    });

    let _scrollScheduled = false;
    /** @param {boolean} goToTop */
    function scroll(goToTop = false) {
        if (_scrollScheduled) {
            return;
        }
        _scrollScheduled = true;
        requestAnimationFrame(() => {
            setTimeout(() => {
                // @ts-ignore
                scrollbars.forEach(scrollbar => {
                    const { viewport } = scrollbar.elements();
                    viewport.scrollTo({ top: goToTop ? 0 : viewport.scrollHeight, behavior: 'smooth' });
                });
                _scrollScheduled = false;
            }, 150);
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
                    onclick={() => scroll()}
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
        </div>

        <div class="pl-scroll-area conv-state-log-scrollbar" class:pl-hide={selectedTab !== conversationStateLogTab}>
            <ul class="pl-list">
                {#each convStateLogs as log (log.uid)}
                    <ConversationStateLogElement data={log} />
                {/each}
            </ul>
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

