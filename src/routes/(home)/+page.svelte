<script>
    import Link from "svelte-link";
    import { Container, Row, Col } from '@sveltestrap/sveltestrap';
    import HeadTitle from "$lib/common/HeadTitle.svelte";
    import { PUBLIC_LOGO_URL, PUBLIC_BRAND_NAME } from '$env/static/public';
  </script>
  
  <HeadTitle title="{PUBLIC_BRAND_NAME} Workspace" />
  
  <div class="home-btn d-none d-sm-block">
    <Link href="/" class="text-dark">              
        <img
            src={PUBLIC_LOGO_URL}
            alt="logo"
            height="50"
            class="auth-logo-dark mx-auto"
        />
    </Link>
  </div>
  
  <div class="my-5 pt-sm-5">
      <Container>
          <Row>
              <Col lg="12">
                  <div class="text-center">
                      <Row class="justify-content-center mt-5">
                          <Col sm="8">
                              <div class="maintenance-img">
                                <img src="/images/megamenu-img.png" alt="" style="width: 25vw;" />
                              </div>
                          </Col>
                      </Row>
                      <h4 class="mt-5">Let&#39;s <a href="/login">get started</a> with {PUBLIC_BRAND_NAME}</h4>
                      <p class="text-muted">
                      A central workspace for building, testing and evaluating your AI Agents.
                      </p>
                  </div>
              </Col>
          </Row>
      </Container>
  </div>
  