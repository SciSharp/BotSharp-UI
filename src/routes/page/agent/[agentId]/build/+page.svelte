
<script>
    import { Node, Svelvet, ThemeToggle} from 'svelvet';
</script>

<div id="svelet-agent-build">
    <Svelvet zoom={0.8} minimap controls>
        <ThemeToggle main="light" alt="dark" slot="toggle" />
    </Svelvet>
</div>

<style>
    #svelet-agent-build {
        height: 80vh;
        width: "100%";
    }
</style>