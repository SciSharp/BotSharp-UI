<script>
    import { onMount, tick } from "svelte";
    import {
        Button,
        Form,
        FormGroup,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader,
        Input,
        Card,
        CardBody,
        CardHeader
    } from "@sveltestrap/sveltestrap";
    import util from "lodash";
	import { getVectorCollectionDetails } from "$lib/services/knowledge-base-service";
	import { VectorIndexSchemaType } from "$lib/helpers/enums";
    import Select from "$lib/common/Select.svelte";

    /** @type {string} */
    export let collection;

    /** @type {boolean} */
    export let open = false;

    /** @type {string} */
    export let className = "";

    /** @type {string} */
    export let title;

    /** @type {string} */
    export let size = 'xl';

    /** @type {number} */
    export let limit = 30;

    /** @type {() => void} */
    export let toggleModal;

    /** @type {(e: any) => void} */
    export let confirm;

    /** @type {() => void} */
    export let cancel;


    const maxLength = 500;
    const indexTypeOptions = Object.entries(VectorIndexSchemaType).map(([k, v]) => ({
        label: k.toLowerCase(),
        value: v
    }));

    /** @type any */
    let addIndexScrollContainer = null;

    /** @type any */
    let deleteIndexScrollContainer = null;

    /** @type {{ field_name: string, field_schema_type: string }[]} */
    let indexesToAdd = [];

    /** @type {{ field_name: string, field_schema_type: string }[]} */
    let indexesToDelete = [];

    onMount(() => {
        init();
    });

    function init() {
        indexesToAdd = [];
        indexesToDelete = [];
        getCollectionDetail();
    }

    function getCollectionDetail() {
		return new Promise((resolve, reject) => {
			getVectorCollectionDetails(collection).then(res => {
				indexesToAdd = res?.payload_schema?.map(x => ({
                    field_name: x.field_name,
                    field_schema_type: x.field_data_type
                })) || [];
				resolve(res);
			}).catch(err => {
				indexesToAdd = [];
				resolve([]);
			});
		});
	}

    /** @param {any} e */
    function handleConfirm(e) {
        e.preventDefault();

        const validIndexesToAdd = indexesToAdd.filter(x => !!util.trim(x.field_name) && !!x.field_schema_type);
        const validIndexesToDelete = indexesToDelete.filter(x => !!util.trim(x.field_name) && !!x.field_schema_type);

        const res = {
            addIndexes: validIndexesToAdd.map(x => ({ ...x, field_name: util.trim(x.field_name) })),
            deleteIndexes: validIndexesToDelete.map(x => ({ ...x, field_name: util.trim(x.field_name) })),
        };
        confirm?.(res);
    }

    /** @param {any} e */
    function handleCancel(e) {
        e.preventDefault();
        cancel?.();
    }

    /** @param {any} e */
    async function addNewIndex(e) {
        e.preventDefault();

        indexesToAdd = [...indexesToAdd, { field_name: '', field_schema_type: '' }];

        if (addIndexScrollContainer) {
            await tick();
            setTimeout(() => {
                addIndexScrollContainer.scrollTo({
                    top: addIndexScrollContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }, 0);
        }
    }

    /**
     * @param {any} e
     * @param {number} idx
     */
    function removeIndex(e, idx) {
        e.preventDefault();
        indexesToAdd = indexesToAdd.filter((_, i) => i !== idx);
    }

    /**
     * @param {any} e
     * @param {number} idx
     */
    function moveItemToDelete(e, idx) {
        e.preventDefault();

        const item = indexesToAdd[idx];
        indexesToDelete = [...indexesToDelete, item];
        indexesToAdd = indexesToAdd.filter((_, i) => i !== idx);
    }

    /** @param {any} e */
    async function addToDeleteIndex(e) {
        e.preventDefault();

        indexesToDelete = [...indexesToDelete, { field_name: '', field_schema_type: '' }];

        if (deleteIndexScrollContainer) {
            await tick();
            setTimeout(() => {
                deleteIndexScrollContainer.scrollTo({
                    top: deleteIndexScrollContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }, 0);
        }
    }

    /**
     * @param {any} e
     * @param {number} index
     */
    function removeFromDeleteList(e, index) {
        e.preventDefault();
        indexesToDelete = indexesToDelete.filter((_, i) => i !== index);
    }

    /**
     * @param {number} idx
     * @param {string} value
     */
    function updateIndexFieldName(idx, value) {
        indexesToAdd[idx].field_name = value;
        indexesToAdd = [...indexesToAdd];
    }

    /**
     * @param {any} e
     * @param {number} idx
     */
    function updateIndexFieldType(e, idx) {
        // @ts-ignore
        const selectedValues = e.detail.selecteds?.map(x => x.value) || [];
        indexesToAdd[idx].field_schema_type = selectedValues.length > 0 ? selectedValues[0] : '';
        indexesToAdd = [...indexesToAdd];
    }


    /**
     * @param {number} idx
     * @param {string} value
     */
    function updateDeleteIndexFieldName(idx, value) {
        indexesToDelete[idx].field_name = value;
        indexesToDelete = [...indexesToDelete];
    }

    /** @param {any} e */
    function moveAllToDelete(e) {
        e.preventDefault();
        indexesToDelete = [...indexesToDelete, ...indexesToAdd];
        indexesToAdd = [];
    }

    /** @param {any} e */
    function moveAllToAdd(e) {
        e.preventDefault();
        indexesToAdd = [...indexesToAdd, ...indexesToDelete];
        indexesToDelete = [];
    }

    /**
     * @param {any} e
     * @param {number} idx
     */
    function moveItemToAdd(e, idx) {
        e.preventDefault();
        const item = indexesToDelete[idx];
        indexesToDelete = indexesToDelete.filter((_, i) => i !== idx);
        indexesToAdd = [...indexesToAdd, item];
    }
</script>


<Modal
    class={className}
    fade
    size={size}
    isOpen={open}
    toggle={() => toggleModal && toggleModal()}
    unmountOnClose
>
    <ModalHeader>
        <div>{title}</div>
        <div>
            <span class="fw-bold">{'Collection: '}</span>
            <span class="text-primary collection-value">{collection}</span>
        </div>
    </ModalHeader>
    <ModalBody class="thin-scrollbar" style="max-height: 70vh; overflow-y: auto;">
        <Form>
            <div class="mt-2">
                <!-- Main container using CSS Grid for responsive layout -->
                <div class="index-layout-container">
                    <!-- Existing Index Items Block -->
                    <div class="index-block">
                        <Card class="index-block-card">
                            <CardHeader>
                                <div class="d-flex justify-content-between align-items-center">
                                    <h6 class="mb-0">Index Items to Add</h6>
                                    <Button
                                        size="sm"
                                        color="primary"
                                        disabled={indexesToAdd.length >= limit}
                                        on:click={(e) => addNewIndex(e)}
                                    >
                                        <i class="mdi mdi-plus"></i> Add
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardBody class="card-body-scrollable">
                                <div
                                    class="thin-scrollbar"
                                    style="height: 100%; overflow-y: auto;"
                                    bind:this={addIndexScrollContainer}
                                >
                                    {#if indexesToAdd.length === 0}
                                        <div class="text-muted text-center py-3">
                                            No index items. Click "Add" to create one.
                                        </div>
                                    {:else}
                                        {#each indexesToAdd as item, idx (idx)}
                                            <div class="mb-3 p-3 border rounded">
                                                <div class="d-flex justify-content-between align-items-center mb-2">
                                                    <small class="text-muted">Index Item {idx + 1}</small>
                                                    <div class="d-flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            color="info"
                                                            on:click={(e) => moveItemToDelete(e, idx)}
                                                            title="Move to delete list"
                                                        >
                                                            <i class="mdi mdi-arrow-right arrow-horizontal"></i>
                                                            <i class="mdi mdi-arrow-down arrow-vertical"></i>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            color="danger"
                                                            on:click={(e) => removeIndex(e, idx)}
                                                            title="Remove item"
                                                        >
                                                            <i class="mdi mdi-trash-can"></i>
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div class="field-row">
                                                    <div class="field-item">
                                                        <FormGroup class="mb-2">
                                                            <label class="form-label" for={`field-name-${idx}`}>
                                                                Field Name
                                                            </label>
                                                            <Input
                                                                id={`field-name-${idx}`}
                                                                type="text"
                                                                value={item.field_name}
                                                                placeholder="Enter field name"
                                                                maxlength={maxLength}
                                                                on:input={(e) => updateIndexFieldName(idx, e.target.value)}
                                                            />
                                                        </FormGroup>
                                                    </div>
                                                    <div class="field-item">
                                                        <FormGroup class="mb-2">
                                                            <label class="form-label" for={`index-type-${idx}`}>
                                                                Field Type
                                                            </label>
                                                            <Select
                                                                tag={`index-type-${idx}`}
                                                                placeholder="Select field type"
                                                                selectedValues={item.field_schema_type ? [item.field_schema_type] : []}
                                                                options={indexTypeOptions}
                                                                on:select={(e) => updateIndexFieldType(e, idx)}
                                                            />
                                                        </FormGroup>
                                                    </div>
                                                </div>
                                            </div>
                                        {/each}
                                    {/if}
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    <!-- Arrow buttons container -->
                    <div class="arrow-container">
                        <div class="arrow-buttons">
                            <Button
                                color="info"
                                size="sm"
                                disabled={indexesToAdd.length === 0}
                                on:click={(e) => moveAllToDelete(e)}
                                title="Move all items to delete list"
                            >
                                <i class="mdi mdi-arrow-right arrow-horizontal"></i>
                                <i class="mdi mdi-arrow-down arrow-vertical"></i>
                            </Button>
                            <Button
                                color="info"
                                size="sm"
                                disabled={indexesToDelete.length === 0}
                                on:click={(e) => moveAllToAdd(e)}
                                title="Move all items to existing list"
                            >
                                <i class="mdi mdi-arrow-left arrow-horizontal"></i>
                                <i class="mdi mdi-arrow-up arrow-vertical"></i>
                            </Button>
                        </div>
                    </div>

                    <!-- Delete Index Items Block -->
                    <div class="index-block">
                        <Card class="index-block-card">
                            <CardHeader>
                                <div class="d-flex justify-content-between align-items-center">
                                    <h6 class="mb-0">Index Items to Delete</h6>
                                    <Button
                                        size="sm"
                                        color="warning"
                                        disabled={indexesToDelete.length >= limit}
                                        on:click={(e) => addToDeleteIndex(e)}
                                    >
                                        <i class="mdi mdi-plus"></i> Add
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardBody class="card-body-scrollable">
                                <div
                                    class="thin-scrollbar"
                                    style="height: 100%; overflow-y: auto;"
                                    bind:this={deleteIndexScrollContainer}
                                >
                                    {#if indexesToDelete.length === 0}
                                        <div class="text-muted text-center py-3">
                                            No items to delete. Click "Add" to specify items for deletion.
                                        </div>
                                    {:else}
                                        {#each indexesToDelete as item, idx (idx)}
                                            <div class="mb-3 p-3 border rounded border-warning">
                                                <div class="d-flex justify-content-between align-items-center mb-2">
                                                    <small class="text-warning">Delete Item {idx + 1}</small>
                                                    <div class="d-flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            color="info"
                                                            on:click={(e) => moveItemToAdd(e, idx)}
                                                            title="Move to existing list"
                                                        >
                                                            <i class="mdi mdi-arrow-left arrow-horizontal"></i>
                                                            <i class="mdi mdi-arrow-up arrow-vertical"></i>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            color="danger"
                                                            title="Remove item"
                                                            on:click={(e) => removeFromDeleteList(e, idx)}
                                                        >
                                                            <i class="mdi mdi-trash-can"></i>
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div class="field-row">
                                                    <div class="field-item">
                                                        <FormGroup class="mb-2">
                                                            <label class="form-label" for={`delete-field-name-${idx}`}>
                                                                Field Name
                                                            </label>
                                                            <Input
                                                                id={`delete-field-name-${idx}`}
                                                                type="text"
                                                                value={item.field_name}
                                                                placeholder="Enter field name to delete"
                                                                maxlength={maxLength}
                                                                on:input={(e) => updateDeleteIndexFieldName(idx, e.target.value)}
                                                            />
                                                        </FormGroup>
                                                    </div>
                                                </div>
                                            </div>
                                        {/each}
                                    {/if}
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </Form>
    </ModalBody>
    <ModalFooter>
        <Button
            color="primary"
            on:click={(e) => handleConfirm(e)}
        >
            Confirm
        </Button>
        <Button
            color="secondary"
            on:click={(e) => handleCancel(e)}
        >
            Cancel
        </Button>
    </ModalFooter>
</Modal>