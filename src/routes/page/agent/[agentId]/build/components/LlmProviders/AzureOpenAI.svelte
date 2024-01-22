<script>
	import { generateInput, generateOutput, Slider, Node } from 'svelvet';
	import NodeWrapper from '../NodeWrapper.svelte';

    /** 
     * @typedef {Object} Inputs
     * @property {number} temperature 
	 * @property {number} topP
	 * @property {number} maxResponseTokens
     * */

     /** @type Inputs */
	const initialData = {
		temperature: 0.7,
		topP: 0.95,
		maxResponseTokens: 128
	};
	const inputs = generateInput(initialData);
	const procesor = (inputs) => inputs.temperature;
	const output = generateOutput(inputs, procesor);
</script>

<Node useDefaults position={{ x: 40, y: 200 }} let:destroy>
	<NodeWrapper {destroy} title="Azure OpenAI" outputStore={output} key="noise">
		<div class="node-body">
			<select>
				<option value="0">GPT-3.5 Turbo</option>
				<option value="1">GPT-4 Turbo</option>
			</select>
			<hr />
			<Slider label="Max Response" min={1} max={4096} fixed={2} step={10} parameterStore={$inputs.maxResponseTokens} />
			<Slider label="Temperature" min={0} max={1} fixed={2} step={0.01} parameterStore={$inputs.temperature} />
			<Slider label="Top P" min={0} max={1} fixed={2} step={0.01} parameterStore={$inputs.topP} />
		</div>
	</NodeWrapper>
</Node>

<style>
	.node-body {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
</style>
