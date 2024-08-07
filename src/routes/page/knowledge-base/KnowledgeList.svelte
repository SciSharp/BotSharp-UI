<script>
  import { _ } from 'svelte-i18n';
  import Link from "svelte-link";
  import {
    Table,
    DropdownMenu,
    DropdownToggle,
    Dropdown,
  } from "@sveltestrap/sveltestrap";

  const recentfile = [
    {
      id: 1,
      icon: "mdi mdi-file-document font-size-16 align-middle text-primary me-2",
      file: "index.html",
      date: "12-10-2020, 09:45",
      size: "09",
    },
  ];
</script>

<div class="mt-4">
  <div class="d-flex flex-wrap">
    <h5 class="font-size-16 me-3">{$_('Knowledges')}</h5>

    <!-- <div class="ms-auto">
      <Link to="#" class="fw-medium text-reset">{$_('View All')}</Link>
    </div> -->
  </div>
  <hr class="mt-2" />

  <div class="table-responsive">
    <Table class="table align-middle table-nowrap table-hover mb-0">
      <thead>
        <tr>
          <th scope="col">{$_('Name')}</th>
          <th scope="col">{$_('Date modified')}</th>
          <th scope="col" colSpan="2"> {$_('Size')} </th>
        </tr>
      </thead>
      <tbody>
        {#each recentfile as recentfile}
          <tr>
            <td>
              <Link to="#" class="text-dark fw-medium">
                <i class={recentfile.icon} />
                {recentfile.file}
              </Link>
            </td>
            <td>{recentfile.date}</td>
            <td>{recentfile.size} KB</td>
            <td>
              <Dropdown>
                <DropdownToggle
                  color=""
                  class="font-size-16 text-muted dropdown-toggle"
                  tag="div"
                >
                  <i class="mdi mdi-dots-horizontal" />
                </DropdownToggle>

                <DropdownMenu direction="right" class="dropdown-menu-end">
                  <Link class="dropdown-item" to="#">{$_('Open')}</Link>
                  <Link class="dropdown-item" to="#">{$_('Edit')}</Link>
                  <Link class="dropdown-item" to="#">{$_('Rename')}</Link>
                  <div class="dropdown-divider" />
                  <Link class="dropdown-item" to="#">{$_('Remove')}</Link>
                </DropdownMenu>
              </Dropdown>
            </td>
          </tr>
        {/each}
      </tbody>
    </Table>
  </div>
</div>