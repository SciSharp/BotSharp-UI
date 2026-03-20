<script>
    import Link from "svelte-link";
    import { fade } from 'svelte/transition';
    import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from '@sveltestrap/sveltestrap';
    import HeadTitle from "$lib/common/shared/HeadTitle.svelte";
    import {
        PUBLIC_LOGO_URL,
        PUBLIC_BRAND_NAME,
        PUBLIC_COMPANY_WEBSITE,
        PUBLIC_HOME_SLOGAN,
        PUBLIC_HOME_IMAGE,
        PUBLIC_SERVICE_URL,
        PUBLIC_ENVIRONMENTS
    } from '$env/static/public';
    import { onMount } from 'svelte';

    let show = false;
    let envDropdownOpen = false;

    /** @type {{ label: string, url: string }[]} */
    const environments = PUBLIC_ENVIRONMENTS ? JSON.parse(PUBLIC_ENVIRONMENTS) : [];

    $: showEnvSwitcher = PUBLIC_BRAND_NAME === 'One Brain' &&
        (PUBLIC_SERVICE_URL.indexOf('meshlive') > 0 || PUBLIC_SERVICE_URL.indexOf('meshtest') > 0);

    onMount(() => { show = true; });
</script>

<HeadTitle title="{PUBLIC_BRAND_NAME} Workspace" />

<div class="home-wrapper">
    <!-- Top bar -->
    <div class="home-topbar">
        <Link href={PUBLIC_COMPANY_WEBSITE} class="home-logo-link">
            <img src={PUBLIC_LOGO_URL} alt="logo" height="36" class="auth-logo-dark" />
        </Link>
        {#if showEnvSwitcher}
            <Dropdown isOpen={envDropdownOpen} toggle={() => (envDropdownOpen = !envDropdownOpen)}>
                <DropdownToggle tag="a" color="" class="btn waves-effect text-muted shadow-none home-env-toggle">
                    <span>Switch Environment</span>
                    <i class="mdi mdi-chevron-down ms-1"></i>
                </DropdownToggle>
                <DropdownMenu end>
                    {#each environments as env}
                        <DropdownItem href={env.url}>{env.label}</DropdownItem>
                    {/each}
                </DropdownMenu>
            </Dropdown>
        {/if}
    </div>

    <!-- Hero -->
    <div class="home-hero">
        {#if show}
            <div transition:fade={{ delay: 200, duration: 600 }}>
                <img src={PUBLIC_HOME_IMAGE} alt="" class="home-hero-image" />
            </div>
            <div class="home-hero-content" transition:fade={{ delay: 400, duration: 600 }}>
                <h3 class="home-hero-title">
                    Welcome to <span class="text-primary">{PUBLIC_BRAND_NAME}</span>
                </h3>
                <p class="home-hero-slogan text-muted">{PUBLIC_HOME_SLOGAN}</p>
                <a href="login" class="btn btn-primary px-4">Get Started</a>
            </div>
        {/if}
    </div>
</div>

<style>
    .home-wrapper {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }
    .home-topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 2rem;
        border-bottom: 1px solid var(--bs-border-color, #f0f0f0);
    }
    :global(.home-env-toggle) {
        font-size: 0.8125rem;
        border: none !important;
    }
    .home-hero {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 3rem 1rem;
        gap: 2rem;
    }
    .home-hero-image {
        width: min(280px, 30vw);
    }
    .home-hero-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
    }
    .home-hero-title {
        font-size: 1.6rem;
        font-weight: 600;
        margin: 0;
    }
    .home-hero-slogan {
        font-size: 0.9rem;
        max-width: 420px;
        margin: 0;
    }
</style>
  
