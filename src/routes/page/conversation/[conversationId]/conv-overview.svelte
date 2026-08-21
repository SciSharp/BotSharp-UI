<script>
    import { utcToLocal } from '$lib/helpers/datetime';
    import { _ } from 'svelte-i18n';

    /** @type {{ conversation: import('$conversationTypes').ConversationModel }} */
    let { conversation } = $props();
</script>

<div class="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">
    <!-- Header: avatar + title + date in a single horizontal band -->
    <div class="relative overflow-hidden border-b border-gray-100 dark:border-gray-700">
        <div class="absolute inset-0 bg-linear-to-br from-primary/10 via-white to-primary/5 dark:from-primary/20 dark:via-gray-800 dark:to-primary/10"></div>
        <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/10"></div>
        <div class="absolute -bottom-6 -left-2 h-14 w-14 rounded-full bg-primary/5"></div>

        <div class="relative flex items-center gap-3 px-5 py-4">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-hover text-white shadow-md ring-2 ring-white/60 dark:ring-gray-800">
                <i class="mdi mdi-forum-outline text-xl leading-none"></i>
            </span>
            <div class="min-w-0 flex-1">
                <h5
                    class="conv-title mb-0.5 line-clamp-2 text-sm font-semibold leading-snug text-dark dark:text-gray-100"
                    title={conversation.title}
                >
                    {conversation.title || 'Untitled conversation'}
                </h5>
                <p class="mb-0 inline-flex items-center gap-1 text-[0.7rem] text-muted">
                    <i class="mdi mdi-clock-outline text-xs leading-none"></i>
                    {utcToLocal(conversation.created_time)}
                </p>
            </div>
        </div>
    </div>

    <div class="px-5 py-4">
        <ul class="m-0 list-none space-y-2 p-0">
            <li class="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <i class="bx bx-phone text-lg leading-none"></i>
                </span>
                <div class="min-w-0 flex-1">
                    <div class="text-xs font-semibold uppercase tracking-wider text-muted">{$_('Channel')}</div>
                    <div class="mt-0.5 truncate text-sm font-medium text-dark dark:text-gray-100">{conversation.channel}</div>
                </div>
            </li>
            <li class="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <i class="bx bx-mail-send text-lg leading-none"></i>
                </span>
                <div class="min-w-0 flex-1">
                    <div class="text-xs font-semibold uppercase tracking-wider text-muted">{$_('User')}</div>
                    <div class="mt-0.5 truncate text-sm font-medium text-dark dark:text-gray-100">{conversation.user.full_name}</div>
                </div>
            </li>
            <li class="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <i class="bx bx-globe text-lg leading-none"></i>
                </span>
                <div class="min-w-0 flex-1">
                    <div class="text-xs font-semibold uppercase tracking-wider text-muted">{$_('Status')}</div>
                    <div class="mt-0.5 break-words text-sm font-medium text-dark dark:text-gray-100">{conversation.status}</div>
                </div>
            </li>
            <li class="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <i class="bx bx-map text-lg leading-none"></i>
                </span>
                <div class="min-w-0 flex-1">
                    <div class="text-xs font-semibold uppercase tracking-wider text-muted">{$_('Location')}</div>
                    <div class="mt-0.5 truncate text-sm font-medium text-dark dark:text-gray-100">Oakridge Lane Richardson.</div>
                </div>
            </li>
            {#if conversation.tags?.length > 0}
            <li class="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <i class="bx bx-tag text-lg leading-none"></i>
                </span>
                <div class="min-w-0 flex-1">
                    <div class="text-xs font-semibold uppercase tracking-wider text-muted">{$_('Tags')}</div>
                    <div class="mt-1 flex flex-wrap gap-1">
                        {#each conversation.tags as tag}
                            <span class="inline-flex items-center rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">{tag}</span>
                        {/each}
                    </div>
                </div>
            </li>
            {/if}
        </ul>
    </div>
</div>