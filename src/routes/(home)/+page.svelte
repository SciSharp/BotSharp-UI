<script>
    import Link from "svelte-link";
    import { fade } from 'svelte/transition';
    import { Container, Row, Col } from '@sveltestrap/sveltestrap';
    import HeadTitle from "$lib/common/HeadTitle.svelte";
    import { 
        PUBLIC_LOGO_URL, 
        PUBLIC_BRAND_NAME, 
        PUBLIC_COMPANY_WEBSITE,
        PUBLIC_HOME_SLOGAN, 
        PUBLIC_HOME_IMAGE 
    } from '$env/static/public';
    import { onMount } from 'svelte';

    let showHomeImage = false;
    let showHomeSlogan = false;
	onMount(async () => {
        showHomeImage = true;
        showHomeSlogan = true;
	});    
</script>
  
<HeadTitle title="{PUBLIC_BRAND_NAME} Workspace" />

<Container>
    <Row>
        <Col class="mt-5 text-end">
            <Link href={PUBLIC_COMPANY_WEBSITE} class="text-dark">              
                <img
                    src={PUBLIC_LOGO_URL}
                    alt="logo"
                    height="50"
                    class="auth-logo-dark mx-auto"
                />
            </Link>                
        </Col>
    </Row>
    <Row class="d-flex justify-content-center align-items-center" style="height: 60vh;">
        <Col lg="12">
            <div class="text-center">
                <Row class="justify-content-center mt-5">
                    <Col sm="8">
                        {#if showHomeImage}
                        <div class="maintenance-img" transition:fade={{ delay: 300, duration: 500 }}>
                        <img src={PUBLIC_HOME_IMAGE} alt="" style="width: 25vw;" />
                        </div>
                        {/if}
                    </Col>
                </Row>
                {#if showHomeSlogan}
                <h4 class="mt-5" transition:fade={{ delay: 500, duration: 500 }}>Let&#39;s <a href="login" class="btn btn-primary">get started</a> with {PUBLIC_BRAND_NAME} </h4>
                <p class="text-muted" transition:fade={{ delay: 800, duration: 500 }}>
                {PUBLIC_HOME_SLOGAN}
                </p>
                {/if}
            </div>
        </Col>
    </Row>
</Container>
  
