<script>
    import { fade } from 'svelte/transition';
    import HeadTitle from "$lib/common/shared/HeadTitle.svelte";
    import {
        PUBLIC_LOGO_URL,
        PUBLIC_BRAND_NAME,
        PUBLIC_COMPANY_WEBSITE,
        PUBLIC_HOME_SLOGAN,
        PUBLIC_HOME_IMAGE,
        PUBLIC_ENVIRONMENTS
    } from '$env/static/public';
    import { onMount } from 'svelte';

    let showHomeImage = $state(false);
    let showHomeSlogan = $state(false);
    let envMenuOpen = $state(false);

    /** @type {Array<Record<string, string>>} */
    let environments = $state([]);
    try {
        environments = JSON.parse(PUBLIC_ENVIRONMENTS || '[]');
    } catch {
        environments = [];
    }

    onMount(() => {
        showHomeImage = true;
        showHomeSlogan = true;
    });

    function toggleEnvMenu() {
        envMenuOpen = !envMenuOpen;
    }

    function closeEnvMenu() {
        envMenuOpen = false;
    }
</script>

<HeadTitle title="{PUBLIC_BRAND_NAME} Workspace" />

<div class="relative min-h-screen px-4">
    <!-- Logo: top-right -->
    <div class="absolute top-6 right-6 z-10 sm:top-8 sm:right-8">
        <a href={PUBLIC_COMPANY_WEBSITE} class="text-dark">
            <img src={PUBLIC_LOGO_URL} alt="logo" class="h-10 w-auto sm:h-12" />
        </a>
    </div>

    <!-- Environment switcher: top-left -->
    {#if environments.length > 0}
        <div class="absolute top-6 left-6 z-10 sm:top-8 sm:left-8">
            <div class="relative">
                <button
                    onclick={toggleEnvMenu}
                    class="flex cursor-pointer items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
                    aria-haspopup="true"
                    aria-expanded={envMenuOpen}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                    </svg>
                    Environments
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-gray-400 transition-transform {envMenuOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {#if envMenuOpen}
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                        class="fixed inset-0 z-10"
                        onclick={closeEnvMenu}
                        onkeydown={e => e.key === 'Escape' && closeEnvMenu()}
                    ></div>
                    <ul
                        class="absolute left-0 z-20 mt-1 min-w-[160px] rounded border border-gray-200 bg-white py-1 shadow-lg"
                        role="menu"
                    >
                        {#each environments as env}
                            <li role="menuitem">
                                <a
                                    href={env.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onclick={closeEnvMenu}
                                    class="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    {env.name ?? env.label ?? env.title ?? env.text ?? env.url}
                                </a>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
        </div>
    {/if}

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

