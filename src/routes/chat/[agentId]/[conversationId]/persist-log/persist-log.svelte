<script>
    import { afterUpdate, beforeUpdate, onDestroy, onMount, tick } from 'svelte';
    import { page } from '$app/stores';
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
    const conversationId = $page.params.conversationId;
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

    /** @type {import('$conversationTypes').ConversationContentLogModel[]} */
    export let contentLogs = [];

    /** @type {import('$conversationTypes').ConversationStateLogModel[]} */
    export let convStateLogs = [];

    /** @type {boolean} */
    export let autoScroll = false;

    /** @type {() => void} */
    export let closeWindow;

    /** @type {() => void} */
    export let cleanScreen;

    /** @type {any[]} */
    let scrollbars = [];
    /** @type {number} */
    let selectedTab = contentLogTab;

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
			theme: 'os-theme-dark',
			pointers: ['mouse', 'touch', 'pen']
		}
	};

    onMount(async () => {
        await getChatContentLogs();
        await getChatStateLogs();

        initScrollbars();
		scrollToBottom();
	});

    beforeUpdate(() => {});

    afterUpdate(() => {
        refresh();
    });

    onDestroy(() => {
        cleanLogs();
    });

    function refresh() {
        if (autoScroll) {
            scrollToBottom();
        }
        
    }

    function scrollToBottom() {
        // @ts-ignore
        scrollbars.forEach(scrollbar => {
            setTimeout(() => {
                const { viewport } = scrollbar.elements();
                viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
            }, 200);
        });
    }

    function initScrollbars() {
        scrollbarElements.forEach(item => {
            const elem = document.querySelector(item.id);
            if (!elem) return;

            const scrollbar = OverlayScrollbars(elem, options);
            scrollbar.on("scroll", async (e) => {
                const curScrollTop = e.elements().scrollOffsetElement.scrollTop;
                if (curScrollTop <= 3 && curScrollTop > 0) {
                    if (item.type === contentLogTab) {
                        await getChatContentLogs();
                    } else if (item.type === conversationStateLogTab) {
                        await getChatStateLogs();
                    }
                }
            });

            scrollbars = [ ...scrollbars, scrollbar];
        });
    }

    async function getChatContentLogs() {
        if (!contentLogFilter.startTime) return;

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
        cleanScreen && cleanScreen();
    }
    
    /** @param {number} selected */
    function handleTabClick(selected) {
        if (selectedTab === selected) {
            return;
        }
        selectedTab = selected;
    }
</script>

<div class="chat-log">
    <div class="card mb-0 log-background log-flex">
        <div class="log-close-btn padding-side log-header">
            <div>
                <button
                    type="button"
                    class="btn btn-sm btn-secondary btn-rounded chat-send waves-effect waves-light"
                    on:click={() => handleCleanScreen()}
                >
                    <i class="bx bx-trash"></i>
                </button>
            </div>
            <div>
                <button
                    type="button"
                    class="btn btn-sm btn-secondary btn-rounded chat-send waves-effect waves-light"
                    on:click={() => closeWindow()}
                >
                    <i class="mdi mdi-window-close"></i>
                </button>
            </div>
        </div>

        <div class="content-log-scrollbar log-list padding-side log-body" class:hide={selectedTab !== contentLogTab}>
            <ul>
                {#each contentLogs as log (log.uid)}
                    <ContentLogElement data={log} />
                {/each}
            </ul>
        </div>

        <div class="conv-state-log-scrollbar log-list padding-side log-body" class:hide={selectedTab !== conversationStateLogTab}>
            <ul>
                {#each convStateLogs as log (log.uid)}
                    <ConversationStateLogElement data={log} />
                {/each}
            </ul>
        </div>

        <div class="log-footer nav-group">
            <NavBar id={'persist-log-container'}>
                <NavItem
                    navBtnId={'content-log-tab'}
                    navBtnClasses={'log-footer-nav-btn'}
                    dataBsTarget={'#content-log-tab-pane'}
                    ariaControls={'content-log-tab-pane'}
                    navBtnText={'Content Log'}
                    disabled={selectedTab === contentLogTab}
                    active={selectedTab === contentLogTab}
                    onClick={() => handleTabClick(contentLogTab)}
                />
                <NavItem
                    navBtnId={'conv-state-log-tab'}
                    navBtnClasses={'log-footer-nav-btn'}
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