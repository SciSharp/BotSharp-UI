<script>
  import Link from "svelte-link";
  import { Badge, Card, CardBody, Col } from "sveltestrap";
  import { format } from '$lib/helpers/datetime';

  /** @type {import('$types').AgentModel[]} */
  export let agents;
</script>

{#each agents as agent}
  <Col xl="4" sm="6">
    <Card>
      <CardBody>
        <div class="d-flex">
          <div class="avatar-md me-4">
            <span class="avatar-title rounded-circle bg-light text-danger font-size-16">
              {#if agent.icon_url}
              <img src={agent.icon_url} alt="" height="60" />
              {:else}
              <img src="/images/users/bot.png" alt="" height="60" />
              {/if}
            </span>
          </div>

          <div class="flex-grow-1 overflow-hidden">
            <h5 class="text-truncate font-size-15">
              <Link href= "/agent/{agent.id}" class="text-dark">
                {agent.name}
              </Link>
            </h5>
            <p class="text-muted mb-4" style="height: 35px;">{agent.description}</p>
            <p>
              <a href= "#" class="btn btn-link" target="_blank">
                <i class="bx bx-book-open" /> Knowledge Base
              </a>
            </p>
            <div class="avatar-group" style="height:35px;">
              {#each agent.functions as fn}
                <div class="avatar-group-item">
                <Link href="#" class="d-inline-block" id={"member" + fn.name}>
                    <img src="/images/function.png" class="rounded-circle avatar-xs" alt={fn.name}/>
                </Link>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </CardBody>
      <div class="px-4 py-3 border-top">
        <ul class="list-inline mb-0">
          <li class="list-inline-item me-3">
            <Badge color={agent.disabled ? "warning" : "success"} class={"bg-" + agent.disabled ? "warning" : "success"}
              >{agent.disabled ? "Disabled" : "Enabled"}</Badge>
          </li>
          {" "}
          <li class="list-inline-item me-3" id="dueDate">
            <i class="bx bx-calendar me-1" />
            {format(agent.updated_datetime)}
          </li>
          {" "}
          <li class="list-inline-item me-3" id="comments">
            <a href= "/chat/{agent.id}" class="btn btn-primary btn-sm" target="_blank">
              <i class="bx bx-chat" /> Live Chat
            </a>
          </li>
        </ul>
      </div>
    </Card>
  </Col>
{/each}