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

<style>
    /* Gradient status code */
    .err-code {
        background-image: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
        -webkit-text-fill-color: transparent;
    }

    /* Backdrop blob drift */
    .err-blob {
        animation: err-blob-anim 16s ease-in-out infinite;
    }
    .err-blob-delayed {
        animation-delay: -8s;
    }
    @keyframes err-blob-anim {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(-20px, 20px) scale(1.08); }
    }

    /* Buttons */
    .err-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        height: 2.5rem;
        padding: 0 1.25rem;
        border: 1px solid transparent;
        border-radius: 0.625rem;
        font-size: 0.875rem;
        font-weight: 500;
        line-height: 1;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
    }
    .err-btn:active {
        transform: translateY(1px);
    }
    .err-btn i {
        font-size: 1.125rem;
        line-height: 1;
    }
    .err-btn-primary {
        background-color: var(--color-primary);
        color: rgb(255 255 255);
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.1),
            0 8px 24px -8px color-mix(in srgb, var(--color-primary) 60%, transparent);
    }
    .err-btn-primary:hover {
        background-color: var(--color-primary-hover);
        box-shadow:
            0 1px 2px rgb(15 23 42 / 0.1),
            0 12px 28px -8px color-mix(in srgb, var(--color-primary) 70%, transparent);
    }
    .err-btn-ghost {
        background-color: rgb(255 255 255);
        border-color: rgb(229 231 235);
        color: rgb(55 65 81);
    }
    .err-btn-ghost:hover {
        background-color: rgb(249 250 251);
        border-color: rgb(209 213 219);
    }
    :global(.dark) .err-btn-ghost {
        background-color: rgb(31 41 55);
        border-color: rgb(55 65 81);
        color: rgb(229 231 235);
    }
    :global(.dark) .err-btn-ghost:hover {
        background-color: rgb(55 65 81);
        border-color: rgb(75 85 99);
    }
</style>