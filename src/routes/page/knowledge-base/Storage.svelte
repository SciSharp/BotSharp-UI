<script>
	import { onMount } from "svelte";
  import { _ } from 'svelte-i18n';
  import Link from "svelte-link";
  import { Card, CardBody } from "@sveltestrap/sveltestrap";
  import "//cdn.jsdelivr.net/npm/apexcharts";

  const options = {
    series: [0],
    chart: {
      height: 150,
      type: "radialBar",
      sparkline: {
        enabled: !0,
      },
    },
    colors: ["#556ee6"],
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        track: {
          background: "#e7e7e7",
          strokeWidth: "97%",
          margin: 5, // margin is in pixels
        },

        hollow: {
          size: "60%",
        },

        dataLabels: {
          name: {
            show: !1,
          },
          value: {
            offsetY: -2,
            fontSize: "16px",
          },
        },
      },
    },
    grid: {
      padding: {
        top: -10,
      },
    },
    stroke: {
      dashArray: 3,
    },
    labels: [$_('Storage')],
  };

  onMount(() => {
    let chart = new ApexCharts(document.getElementById("storageChart"),options)
    chart.render();
  })

</script>

<Card class="filemanager-sidebar ms-lg-2">
  <CardBody>
    <div class="text-center">
      <h5 class="font-size-15 mb-4">{$_('Storage')}</h5>
      <div class="apex-charts">
        <div id="storageChart" class="apex-charts" />
      </div>

      <p class="text-muted mt-4">{$_('0 GB (0%) of 1 GB used')}</p>
    </div>

    <div class="mt-4">
      <Card class="border shadow-none mb-2">
        <Link href="#" class="text-body">
          <div class="p-2">
            <div class="d-flex">
              <div class="avatar-xs align-self-center me-2">
                <div
                  class="avatar-title rounded bg-transparent text-success font-size-20"
                >
                  <i class="mdi mdi-image" />
                </div>
              </div>

              <div class="overflow-hidden me-auto">
                <h5 class="font-size-13 text-truncate mb-1">{$_('Images')}</h5>
                <p class="text-muted text-truncate mb-0">0 {$_('Files')}</p>
              </div>

              <div class="ml-2">
                <p class="text-muted">0 GB</p>
              </div>
            </div>
          </div>
        </Link>
      </Card>

      <div class="card border shadow-none mb-2">
        <Link href="#" class="text-body">
          <div class="p-2">
            <div class="d-flex">
              <div class="avatar-xs align-self-center me-2">
                <div
                  class="avatar-title rounded bg-transparent text-danger font-size-20"
                >
                  <i class="mdi mdi-play-circle-outline" />
                </div>
              </div>

              <div class="overflow-hidden me-auto">
                <h5 class="font-size-13 text-truncate mb-1">{$_('Video')}</h5>
                <p class="text-muted text-truncate mb-0">0 {$_('Files')}</p>
              </div>

              <div class="ml-2">
                <p class="text-muted">0 GB</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div class="card border shadow-none mb-2">
        <Link href="#" class="text-body">
          <div class="p-2">
            <div class="d-flex">
              <div class="avatar-xs align-self-center me-2">
                <div
                  class="avatar-title rounded bg-transparent text-info font-size-20"
                >
                  <i class="mdi mdi-music" />
                </div>
              </div>

              <div class="overflow-hidden me-auto">
                <h5 class="font-size-13 text-truncate mb-1">{$_('Music')}</h5>
                <p class="text-muted text-truncate mb-0">0 {$_('Files')}</p>
              </div>

              <div class="ml-2">
                <p class="text-muted">0 GB</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div class="card border shadow-none mb-2">
        <Link href="#" class="text-body">
          <div class="p-2">
            <div class="d-flex">
              <div class="avatar-xs align-self-center me-2">
                <div
                  class="avatar-title rounded bg-transparent text-primary font-size-20"
                >
                  <i class="mdi mdi-file-document" />
                </div>
              </div>

              <div class="overflow-hidden me-auto">
                <h5 class="font-size-13 text-truncate mb-1">{$_('Document')}</h5>
                <p class="text-muted text-truncate mb-0">0 {$_('Files')}</p>
              </div>

              <div class="ml-2">
                <p class="text-muted">0 GB</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div class="card border shadow-none">
        <Link href="#" class="text-body">
          <div class="p-2">
            <div class="d-flex">
              <div class="avatar-xs align-self-center me-2">
                <div
                  class="avatar-title rounded bg-transparent text-warning font-size-20"
                >
                  <i class="mdi mdi-folder" />
                </div>
              </div>

              <div class="overflow-hidden me-auto">
                <h5 class="font-size-13 text-truncate mb-1">{$_('Others')}</h5>
                <p class="text-muted text-truncate mb-0">0 {$_('Files')}</p>
              </div>

              <div class="ml-2">
                <p class="text-muted">0 GB</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  </CardBody>
</Card>
