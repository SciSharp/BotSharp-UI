<script>
    import { onMount } from 'svelte';
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
        Promise.all([getChatContentLogs(), getChatStateLogs()]).then(() => {
            initScrollbars();
            scroll();
        });

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

    /** @param {boolean} goToTop */
    function scroll(goToTop = false) {
        // @ts-ignore
        scrollbars.forEach(scrollbar => {
            setTimeout(() => {
                const { viewport } = scrollbar.elements();
                viewport.scrollTo({ top: goToTop ? 0 : viewport.scrollHeight, behavior: 'smooth' });
            }, 200);
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

<!--
  NOTE: .content-log-scrollbar and .conv-state-log-scrollbar are DOM hooks
  queried by initScrollbars() (this file) and autoScrollToTargetLog()
  (chat-box.svelte). Keep those class names exactly. Scoped styling is
  applied through .pl-* siblings.
-->
<div class="pl-root">
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

<style>
    /* ===== Root wrapper (replaces .chat-log) ===== */
    .pl-root {
        height: 100vh;
    }

    /* ===== Card shell (replaces .card.mb-0.log-background.log-flex) ===== */
    .pl-card {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: rgb(0 0 0);
        margin-bottom: 0;
        border: 0;
        border-radius: 0;
    }

    /* ===== Sticky header bar with action buttons
            (replaces .log-close-btn.padding-side.log-header) ===== */
    .pl-header-bar {
        flex: 0 0 auto;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
        padding: 0 20px;
        position: sticky;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .pl-action-group {
        display: inline-flex;
        gap: 0.25rem;
    }

    /* Themed action buttons (replace .btn .btn-sm .btn-rounded .chat-send variants) */
    .pl-action-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem 0.6rem;
        font-size: 0.8125rem;
        line-height: 1.2;
        border: 1px solid transparent;
        border-radius: 999px;
        background-color: transparent;
        color: inherit;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }
    .pl-action-btn-secondary {
        background-color: var(--color-secondary);
        border-color: var(--color-secondary);
        color: rgb(255 255 255);
    }
    .pl-action-btn-secondary:hover,
    .pl-action-btn-secondary:focus {
        background-color: color-mix(in srgb, var(--color-secondary) 88%, black 12%);
        border-color: color-mix(in srgb, var(--color-secondary) 88%, black 12%);
    }
    .pl-action-btn-primary {
        background-color: var(--color-primary);
        border-color: var(--color-primary);
        color: rgb(255 255 255);
        border-radius: 0.25rem;
    }
    .pl-action-btn-primary:hover,
    .pl-action-btn-primary:focus {
        background-color: color-mix(in srgb, var(--color-primary) 88%, black 12%);
        border-color: color-mix(in srgb, var(--color-primary) 88%, black 12%);
    }
    .pl-action-btn-light {
        background-color: var(--color-light, #eff2f7);
        border-color: var(--color-light, #eff2f7);
        color: var(--color-dark, #2a3042);
        border-radius: 0.25rem;
    }
    .pl-action-btn-light:hover,
    .pl-action-btn-light:focus {
        background-color: color-mix(in srgb, var(--color-light, #eff2f7) 88%, black 12%);
        border-color: color-mix(in srgb, var(--color-light, #eff2f7) 88%, black 12%);
    }

    /* ===== Scrollable log list (replaces .log-list.padding-side.log-body) ===== */
    .pl-scroll-area {
        flex: 1 1 auto;
        background-color: rgb(0 0 0);
        padding: 0 20px;
        overflow-y: scroll;
        scrollbar-width: none;
    }
    .pl-scroll-area::-webkit-scrollbar {
        display: none;
    }
    .pl-list {
        list-style: none;
        margin: 0;
        padding-left: 2px;
        padding-right: 0;
    }
    /* Hide inactive tab pane (replaces global .hide utility) */
    .pl-hide {
        display: none;
    }

    /* ===== Footer with nav tabs (replaces .log-footer.nav-group) =====
       Note: the nav button font-size override (was .log-footer-nav-btn)
       is passed via NavItem's navBtnStyles prop as inline style — that
       wins the cascade reliably against NavItem's own scoped .tab-btn rule. */
    .pl-footer {
        flex: 0 0 auto;
        margin: 0 3px;
    }
</style>