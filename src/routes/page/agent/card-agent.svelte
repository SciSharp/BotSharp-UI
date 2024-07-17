<script>
  import Link from "svelte-link";
  import { Badge, Card, CardBody, Col } from '@sveltestrap/sveltestrap';
  import { format } from '$lib/helpers/datetime';
  import { _ } from 'svelte-i18n';
	import { LERNER_ID } from "$lib/helpers/constants";

  /** @type {import('$types').AgentModel[]} */
  export let agents;
</script>

{#each agents as agent}
  <Col xl="4" sm="6">
    <Card style={"height: 95%;"}>
      <CardBody>
        <div class="d-flex">
          <div class="avatar-md me-4">
            <span class="avatar-title rounded-circle bg-light text-danger font-size-16">
              {#if agent.icon_url}
              <img src={agent.icon_url} alt="" height="60" />
              {:else}
              <img src="images/users/bot.png" alt="" height="60" />
              {/if}
            </span>
          </div>

          <div class="flex-grow-1 overflow-hidden">
            <h5 class="text-truncate font-size-15">
              <Link href= "page/agent/{agent.id}" class="text-dark">
                {agent.name}
              </Link>
            </h5>
            <p>Provided by {agent.plugin.name}</p>
            <p class="text-muted mb-4" style="height: 35px;">{agent.description}</p>
            <div class="avatar-group" style="height:35px;">
              {#if agent.is_router}
              <div class="avatar-group-item me-3">
                  <img src="icons/router.png" class="rounded-circle avatar-xs" alt="routing"/>
              </div>
              {/if}
              {#if agent.allow_routing}
              <div class="avatar-group-item me-3">
                  <img src="icons/routing-2.png" class="rounded-circle avatar-xs" alt="routing"/>
              </div>
              {/if}
              {#each agent.functions as fn}
                <div class="avatar-group-item">
                <Link href="#" class="d-inline-block" id={"member" + fn.name}>
                    <img src="images/function.png" class="rounded-circle avatar-xs" alt={fn.name}/>
                </Link>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </CardBody>
      <div class="px-4 py-3 border-top">
        <ul class="list-inline mb-0">
          <li class="list-inline-item me-1">
            <Badge color={agent.disabled ? "warning" : "success"}>{agent.disabled ? $_('Disabled') : $_('Enabled')}</Badge>
          </li>
          <li class="list-inline-item me-1">
            <Badge color={agent.is_public ? "success" : "warning"}>{agent.is_public ? $_('Public') : $_('Private')}</Badge>
          </li>
          <li class="list-inline-item me-1" id="dueDate">
            <i class="bx bx-calendar me-1" />
            {format(agent.updated_datetime, 'short-date')}
          </li>
          <li class="list-inline-item me-1">
            <Link href="page/agent/{agent.id}/build" class="btn btn-primary btn-sm" target="_blank" disabled>
              <i class="bx bx-wrench" /> {$_('Build')}
            </Link>
          </li>
          {#if agent.is_public }      
          <li class="list-inline-item me-1">
            <Link href={`/chat/${LERNER_ID}`} class="btn btn-primary btn-sm" target="_blank">
              <i class="bx bx-book-open" /> {$_('Train')}
            </Link>
          </li>
          <li class="list-inline-item me-1">
            <Link href= "chat/{agent.id}" class="btn btn-primary btn-sm" target="_blank">
              <i class="bx bx-chat" /> {$_('Test')}
            </Link>
          </li>
          {/if}
        </ul>
      </div>
    </Card>
  </Col>
{/each}