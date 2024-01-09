<script>
	import { Col, Container, Row } from '@sveltestrap/sveltestrap';
    import { PUBLIC_COMPANY_NAME } from '$env/static/public'

</script>

<footer class="footer">
    <Container fluid>
        <Row>
            <Col sm={6}>
                {new Date().getFullYear()} © {PUBLIC_COMPANY_NAME}.
            </Col>
            <Col sm={6}>
                <div class="text-sm-end d-none d-sm-block">
                    Design & Develop by open source community
                </div>
            </Col>
        </Row>
    </Container>
</footer>