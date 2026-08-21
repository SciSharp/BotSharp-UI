<script>
	import { generateInput, generateOutput, Slider, Node } from 'svelvet';
	import NodeWrapper from './NodeWrapper.svelte';

    /** 
     * @typedef {Object} Inputs 
     * @property {number} width
    */

    /** @type Inputs */
	const initialData = {
		width: 2.5
	};
	const inputs = generateInput(initialData);
	const procesor = (/** @type {any} */ inputs) => inputs.width;
	const output = generateOutput(inputs, procesor);
</script>

<Node useDefaults position={{ x: 40, y: 50 }} let:selected let:destroy>
	<span class="note" id="custom">Function</span>
	<NodeWrapper {destroy} title="API Call" outputStore={output} key="strokeWidth">
		<div class="node-body">
			<Slider min={1} max={12} fixed={1} step={0.1} parameterStore={$inputs.width} />
		</div>
	</NodeWrapper>
</Node>


