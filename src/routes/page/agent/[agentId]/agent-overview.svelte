<script>
    import { Button, Card, CardBody, CardHeader, Col, Table } from '@sveltestrap/sveltestrap';
    import InPlaceEdit from '$lib/common/InPlaceEdit.svelte'
    import { format } from '$lib/helpers/datetime';

    /** @type {import('$types').AgentModel} */
    export let agent;

    /** @type {string[]} */
    export let profiles = [];

    const profileLimit = 10;

    function addProfile() {
        if (!!!agent) return;

        profiles = [...profiles, ''];
        agent.profiles = profiles;
    }

    /**
	 * @param {number} index
	 */
    function removeProfile(index) {
        profiles = profiles.filter((x, idx) => idx !== index);
        agent.profiles = profiles;
    }

    function chatWithAgent() {
        if (!!!agent?.id) return;
        
        window.open(`/chat/${agent?.id}`, '_blank');
    }
</script>

<Card>
    <CardHeader>
        <div class="text-center">
            <img
                src="images/users/bot.png"
                alt=""
                height="50"
                class="mx-auto d-block"
                style="cursor: pointer;"
                tabindex="-1"
                role=''
                on:keydown={() => {}}
                on:click={() => chatWithAgent()}
            />
            <h5 class="mt-1 mb-1"><InPlaceEdit bind:value={agent.name}/></h5>
            <p class="text-muted mb-0">Updated at {format(agent.updated_datetime, 'time')}</p>
        </div>
    </CardHeader>
    <CardBody>
        <div class="table-responsive">
            <Table >
                <tbody>
                    <tr>
                        <th class="agent-prop-key">Type</th>
                        <td>
                            {#if agent.is_router}
                                Routing Agent
                            {:else}
                                Task Agent
                            {/if}
                        </td>
                    </tr>
                    <tr>
                        <th class="agent-prop-key">Visibility</th>
                        <td>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" bind:checked={agent.is_public} id="is_public" />
                                <label class="form-check-label" for="is_public"> Public </label>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th class="agent-prop-key">Routable</th>
                        <td>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" bind:checked={agent.allow_routing} id="allow_routing" />
                                <label class="form-check-label" for="allow_routing">Allow</label>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th class="agent-prop-key">Profiles</th>
                        <td>
                            <div class="agent-profile-container">
                                {#each profiles as profile, index}
                                <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 5px;">
                                    <input
                                        class="form-control"
                                        style="flex: 0.9; border: none; padding-left: 0px;"
                                        type="text"
                                        placeholder="Typing here..."
                                        bind:value={profile} maxlength={30} />
                                    <div style="flex: 0.1; display: flex; align-items: center;">
                                        <i
                                            class="bx bxs-no-entry"
                                            style="cursor: pointer; font-size: 18px; color: red;"
                                            role="link"
                                            tabindex="0"
                                            on:keydown={() => {}}
                                            on:click={() => removeProfile(index)}
                                        />
                                    </div>
                                </div>
                                {/each}
                                {#if profiles?.length < profileLimit}
                                <div style="font-size: 20px;">
                                    <i
                                        class="bx bx bx-list-plus"
                                        style="cursor: pointer;"
                                        role="link"
                                        tabindex="0"
                                        on:keydown={() => {}}
                                        on:click={() => addProfile()}
                                    />
                                </div>
                                {/if}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th class="agent-prop-key">Status</th>
                        <td>							
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" bind:checked={agent.disabled} id="disabled" />
                                <label class="form-check-label" for="disabled">Disabled</label>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th class="agent-prop-key">Created Date</th>
                        <td>{format(agent.created_datetime, 'time')}</td>
                    </tr>
                </tbody>
            </Table>
        </div>
    </CardBody>
</Card>