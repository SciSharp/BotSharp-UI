<script>
	import { onMount } from 'svelte';
	import { getChartColorsArray } from '$lib/common/shared/ChartColorsArray.svelte';
	import ApexCharts from 'apexcharts';
	export let chartColor;

	const radialbarchartColors = getChartColorsArray(chartColor);

	const options = {
		chart: {
			height: 200,
			type: 'radialBar',
			offsetY: -10
		},
		plotOptions: {
			radialBar: {
				startAngle: -135,
				endAngle: 135,
				dataLabels: {
					name: {
						fontSize: '13px',
						color: undefined,
						offsetY: 60
					},
					value: {
						offsetY: 22,
						fontSize: '16px',
						color: undefined,
						formatter: function (val) {
							return val + '%';
						}
					}
				}
			}
		},
		colors: radialbarchartColors,
		fill: {
			type: 'gradient',
			gradient: {
				shade: 'dark',
				shadeIntensity: 0.15,
				inverseColors: false,
				opacityFrom: 1,
				opacityTo: 1,
				stops: [0, 50, 65, 91]
			}
		},
		stroke: {
			dashArray: 4
		},
		series: [67],
		labels: ['Series A']
	};

	onMount(() => {
		const chart = new ApexCharts(document.querySelector('#radialbarchart'), options);
		chart.render();
	});
</script>

<div id="radialbarchart" class="apex-charts" dir="ltr" />
