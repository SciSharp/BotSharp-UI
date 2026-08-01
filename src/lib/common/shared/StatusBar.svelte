<script>
    /**
     * Desktop status bar — a thin strip pinned to the bottom edge of the Tauri window.
     *
     * Desktop only, and rendered from the root layout rather than from VerticalLayout: it
     * is chrome belonging to the WINDOW, not to a page, so it has to be there on the chat
     * routes and the login screen too. In a browser tab there is no window to trim, and a
     * fixed strip would just be 26px of viewport spent on nothing — `isDesktop()` gates
     * the whole component out.
     *
     * Anything shown here has to be cheap and always true. No polling, no requests of its
     * own: the connection state is a read of the traffic the app already generates (see
     * apiStatusStore) and the version comes from the shell that is already running.
     */
    import { onMount } from 'svelte';
    import { PUBLIC_COMPANY_NAME } from '$env/static/public';
    import { apiStatusStore, getUserStore, userStore } from '$lib/helpers/store';
    import { isDesktop } from '$lib/helpers/utils/desktop';

    let show = $state(false);

    /** @type {string} */
    let version = $state('');

    /** Falls back to the session copy: userStore is empty on a reload until something refills it. */
    let userName = $derived($userStore?.full_name || getUserStore()?.full_name || '');

    let connection = $derived.by(() => {
        if ($apiStatusStore === 'online') return { label: 'Connected', dot: 'bg-success' };
        if ($apiStatusStore === 'offline') return { label: 'No connection', dot: 'bg-danger' };
        return { label: 'Connecting', dot: 'bg-muted' };
    });

    onMount(() => {
        if (!isDesktop()) return;
        show = true;

        // Dynamic import so the browser build never pulls in code whose IPC is absent
        // there. A shell that will not report its version is not worth an error dialog —
        // the segment is simply left out.
        import('@tauri-apps/api/app')
            .then(({ getVersion }) => getVersion())
            .then((v) => { version = v; })
            .catch(() => {});
    });
</script>

{#if show}
<!-- z-[1003] puts it above both the sidebar (1001) and the header (1002): the bar spans
     the whole window width, so it has to win against the chrome it crosses. -->
<div
    class="fixed inset-x-0 bottom-0 z-[1003] flex h-[var(--statusbar-height)] items-center gap-3 border-t border-gray-200 bg-gray-50 px-3 text-[0.6875rem] leading-none text-muted select-none dark:border-gray-700 dark:bg-gray-900"
>
    <span class="inline-flex items-center gap-1.5" title={`Backend: ${connection.label}`}>
        <span class="h-1.5 w-1.5 shrink-0 rounded-full {connection.dot}"></span>
        <span>{connection.label}</span>
    </span>

    {#if userName}
        <span class="h-3 w-px shrink-0 bg-gray-200 dark:bg-gray-700"></span>
        <span class="min-w-0 truncate">{userName}</span>
    {/if}

    <!-- Pushes everything after it to the right edge. -->
    <span class="flex-1"></span>

    {#if version}
        <span class="shrink-0 tabular-nums">v{version}</span>
        <span class="h-3 w-px shrink-0 bg-gray-200 dark:bg-gray-700"></span>
    {/if}
    <span class="shrink-0">{new Date().getFullYear()} © {PUBLIC_COMPANY_NAME}</span>
</div>
{/if}
