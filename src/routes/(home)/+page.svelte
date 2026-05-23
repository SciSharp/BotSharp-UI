<script>
    import { fade } from 'svelte/transition';
    import HeadTitle from "$lib/common/shared/HeadTitle.svelte";
    import {
        PUBLIC_LOGO_URL,
        PUBLIC_BRAND_NAME,
        PUBLIC_COMPANY_WEBSITE,
        PUBLIC_HOME_SLOGAN,
        PUBLIC_HOME_IMAGE
    } from '$env/static/public';
    import { onMount } from 'svelte';

    let showHomeImage = $state(false);
    let showHomeSlogan = $state(false);

    onMount(() => {
        showHomeImage = true;
        showHomeSlogan = true;
    });
</script>

<HeadTitle title="{PUBLIC_BRAND_NAME} Workspace" />

<div class="relative min-h-screen px-4">
    <!-- Logo: absolute so it never shifts the centered hero below -->
    <div class="absolute top-6 right-6 z-10 sm:top-8 sm:right-8">
        <a href={PUBLIC_COMPANY_WEBSITE} class="text-dark">
            <img src={PUBLIC_LOGO_URL} alt="logo" class="h-10 w-auto sm:h-12" />
        </a>
    </div>

    <!-- Hero: vertically and horizontally centered on the viewport -->
    <div class="flex min-h-screen flex-col items-center justify-center text-center">
        {#if showHomeImage}
            <div transition:fade={{ delay: 300, duration: 500 }}>
                <img
                    src={PUBLIC_HOME_IMAGE}
                    alt=""
                    class="mx-auto w-full max-w-[260px] sm:max-w-sm md:max-w-md lg:max-w-lg"
                />
            </div>
        {/if}
        {#if showHomeSlogan}
            <h4
                class="mt-8 text-lg font-medium sm:text-xl"
                transition:fade={{ delay: 500, duration: 500 }}
            >
                Let&#39;s
                <a
                    href="login"
                    class="ml-1 inline-flex items-center rounded bg-primary px-3 py-2 text-sm text-white transition-colors hover:bg-primary-hover"
                >
                    get started
                </a>
                with {PUBLIC_BRAND_NAME}
            </h4>
            <p
                class="mt-2 max-w-xl text-muted"
                transition:fade={{ delay: 800, duration: 500 }}
            >
                {PUBLIC_HOME_SLOGAN}
            </p>
        {/if}
    </div>
</div>

