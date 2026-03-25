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

<div class="container">
    <div class="row">
        <div class="col mt-5 text-end">
            <a href={PUBLIC_COMPANY_WEBSITE} class="text-dark">
                <img
                    src={PUBLIC_LOGO_URL}
                    alt="logo"
                    height="50"
                    class="auth-logo-dark mx-auto"
                />
            </a>
        </div>
    </div>
    <div class="row d-flex justify-content-center align-items-center" style="height: 60vh;">
        <div class="col-lg-12">
            <div class="text-center">
                <div class="row justify-content-center mt-5">
                    <div class="col-sm-8">
                        {#if showHomeImage}
                            <div class="maintenance-img" transition:fade={{ delay: 300, duration: 500 }}>
                                <img src={PUBLIC_HOME_IMAGE} alt="" style="max-width: 25vw;" />
                            </div>
                        {/if}
                    </div>
                </div>
                {#if showHomeSlogan}
                    <h4 class="mt-5" transition:fade={{ delay: 500, duration: 500 }}>Let&#39;s <a href="login" class="btn btn-primary">get started</a> with {PUBLIC_BRAND_NAME}</h4>
                    <p class="text-muted" transition:fade={{ delay: 800, duration: 500 }}>
                        {PUBLIC_HOME_SLOGAN}
                    </p>
                {/if}
            </div>
        </div>
    </div>
</div>

