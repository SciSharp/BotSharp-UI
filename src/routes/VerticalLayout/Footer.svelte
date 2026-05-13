<script>
    import { PUBLIC_COMPANY_NAME } from '$env/static/public';
    import { _ } from 'svelte-i18n';
</script>

<footer
    class="footer absolute bottom-0 left-0 right-0 h-[var(--footer-height)] bg-[#f2f2f5] px-3 py-5 text-sm text-muted dark:bg-gray-900"
>
    <div class="mx-auto flex w-full max-w-full flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <div>{new Date().getFullYear()} © {PUBLIC_COMPANY_NAME}</div>
        <div class="hidden sm:block">
            {$_('Design & Developed by open source community')}
        </div>
    </div>
</footer>