<script>
    import 'overlayscrollbars/overlayscrollbars.css';
    import { OverlayScrollbars } from 'overlayscrollbars';
	import { afterUpdate, onDestroy, onMount } from 'svelte';
	import { page } from '$app/stores';
	import { GetStateLogs } from '$lib/services/logging-service';
    import NavBar from '$lib/common/nav-bar/NavBar.svelte';
    import NavItem from '$lib/common/nav-bar/NavItem.svelte';
    import ConversationStateLogElement from './conversation-state-log-element.svelte';
	import MessageStateLogElement from './message-state-log-element.svelte';

    const convStateLogTab = 1;
    const msgStateLogTab = 2;

    /** @type {any[]} */
    export let convStateLogs = [];

    /** @type {any[]} */
    export let msgStateLogs = [];

    /** @type {() => void} */
    export let closeWindow;

    /** @type {() => void} */
    export let cleanScreen;

    /** @type {any} */
    let scrollbars = [];
    let selectedTab = convStateLogTab;

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
        const conversationId = $page.params.conversationId;
        convStateLogs = await GetStateLogs(conversationId);
        
        const scrollbarElements = [
            document.querySelector('.conv-state-log-scrollbar'),
            document.querySelector('.msg-state-log-scrollbar')
        ].filter(Boolean);
        scrollbarElements.forEach(elem => {
            scrollbars = [ ...scrollbars, OverlayScrollbars(elem, options) ];
        });
		refresh();
	});

    afterUpdate(() => {
        refresh();
    });

    onDestroy(() => {
        cleanLogs();
    });

    function refresh() {
        scrollToBottom();
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

    function cleanLogs() {
        convStateLogs = [];
    }

    function handleCleanScreen() {
        cleanLogs();
        cleanScreen && cleanScreen();
    }

    /** @param {number} tab */
    function handleTabClick(tab) {
        selectedTab = tab;
    }
</script>

<div class="chat-log">
    <div class="card mb-0 log-background log-flex">
        <div class="log-close-btn padding-side log-header">
            <div>
                <button
                    type="button"
                    class="btn btn-sm btn-secondary btn-rounded chat-send waves-effect waves-light"
                    on:click={() => closeWindow()}
                >
                    <i class="mdi mdi-window-close"></i>
                </button>
            </div>
            <div>
                <button
                    type="button"
                    class="btn btn-sm btn-secondary btn-rounded chat-send waves-effect waves-light"
                    on:click={() => handleCleanScreen()}
                >
                    <i class="bx bx-trash"></i>
                </button>
            </div>
        </div>
        <div class="conv-state-log-scrollbar log-list padding-side log-content" class:hide={selectedTab !== convStateLogTab}>
            <ul>
                {#each convStateLogs as log}
                    <ConversationStateLogElement data={log} />
                {/each}
            </ul>
        </div>

        <div class="msg-state-log-scrollbar log-list padding-side log-content" class:hide={selectedTab !== msgStateLogTab}>
            <ul>
                {#each msgStateLogs as log}
                    <MessageStateLogElement data={log} />
                {/each}
            </ul>
        </div>

        <div class="log-header">
            <NavBar id={'state-log-container'}>
                <NavItem
                    navBtnId={'conv-state-log-tab'}
                    dataBsTarget={'#conv-state-log-tab-pane'}
                    ariaControls={'conv-state-log-tab-pane'}
                    navBtnText={'Conversation States'}
                    disabled={selectedTab === convStateLogTab}
                    active={selectedTab === convStateLogTab}
                    onClick={() => handleTabClick(convStateLogTab)}
                />
                <NavItem
                    navBtnId={'msg-state-log-tab'}
                    dataBsTarget={'#msg-state-log-tab-pane'}
                    ariaControls={'msg-state-log-tab-pane'}
                    navBtnText={'Message States'}
                    disabled={selectedTab === msgStateLogTab}
                    active={selectedTab === msgStateLogTab}
                    onClick={() => handleTabClick(msgStateLogTab)}
                />
            </NavBar>
        </div>
    </div>
</div>