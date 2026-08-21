<script>
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import HeadTitle from '$lib/common/shared/HeadTitle.svelte';
    import Error500 from '$lib/common/errors/error-500.svelte';

    let status = $derived(page.status);
    let errorMessage = $derived(page.error?.message ?? '');

    /** @param {number} s */
    function getLabel(s) {
        if (s === 404) return 'Page Not Found';
        if (s === 403) return 'Access Forbidden';
        if (s === 401) return 'Unauthorized';
        if (s === 400) return 'Bad Request';
        return 'Something Went Wrong';
    }

    /** @param {number} s */
    function getDescription(s) {
        if (s === 404) return "The page you're looking for doesn't exist or has been moved.";
        if (s === 403) return "You don't have permission to access this resource.";
        if (s === 401) return "You need to sign in to view this page.";
        if (s === 400) return "The request was malformed. Please check and try again.";
        return 'Sorry, something went wrong. Please try again later.';
    }

    function goBack() {
        if (typeof history !== 'undefined' && history.length > 1) {
            history.back();
        } else {
            goto('/page/dashboard');
        }
    }
</script>

{#if status == 500}
    <Error500 />
{:else}
    <HeadTitle title={`${status} Error`} />

    <div class="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-12">
        <!-- Backdrop blobs -->
        <div class="pointer-events-none absolute inset-0 -z-10">
            <div class="err-blob absolute -top-32 -left-32 h-80 w-80 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] blur-3xl"></div>
            <div class="err-blob err-blob-delayed absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[color-mix(in_srgb,var(--color-warning)_22%,transparent)] blur-3xl"></div>
        </div>

        <div class="w-full max-w-xl text-center">
            <!-- Big gradient status code -->
            <div class="err-code select-none text-[7rem] font-bold leading-none tracking-tighter sm:text-[9rem]">
                {status}
            </div>

            <h4 class="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-gray-700 sm:text-base dark:text-gray-200">
                {getLabel(status)}
            </h4>

            <p class="mx-auto mt-4 max-w-md text-sm text-[var(--color-muted)] sm:text-base">
                {errorMessage || getDescription(status)}
            </p>

            <div class="mt-8 flex flex-wrap justify-center gap-3">
                <button
                    class="err-btn err-btn-primary"
                    onclick={() => goto('/page/dashboard')}
                >
                    <i class="bx bx-home-alt"></i>
                    Back to Dashboard
                </button>
                <button
                    class="err-btn err-btn-ghost"
                    onclick={() => goBack()}
                >
                    <i class="bx bx-arrow-back"></i>
                    Go Back
                </button>
            </div>
        </div>
    </div>
{/if}

