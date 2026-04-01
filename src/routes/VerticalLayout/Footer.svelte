<script>
    import { PUBLIC_COMPANY_NAME } from '$env/static/public';
    import { _ } from 'svelte-i18n';
</script>

<footer class="footer">
    <div class="container-fluid">
        <div class="row">
            <div class="col-sm-6">
                {new Date().getFullYear()} © {PUBLIC_COMPANY_NAME}
            </div>
            <div class="col-sm-6">
                <div class="text-sm-end d-none d-sm-block">
                    {$_('Design & Developed by open source community')}
                </div>
            </div>
        </div>
    </div>
</footer>