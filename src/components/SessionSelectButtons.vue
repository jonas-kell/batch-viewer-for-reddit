<script setup lang="ts">
    import { computed, nextTick, ref, watch } from "vue";
    import useSessionsMetaStore from "./../stores/sessionsMeta";
    import toastr from "toastr";
    const sessionsMetaStore = useSessionsMetaStore();

    const props = defineProps({
        scope: {
            type: String,
            default: "page",
        },
        defaultSelectionLabel: {
            type: String,
            default: "Default",
        },
        reset: {
            type: Boolean,
            default: false,
        },
    });
    const emit = defineEmits(["sessionSelected"]);

    const sessions = computed(() => {
        return sessionsMetaStore.getSessions(props.scope);
    });

    const selectDefault = ref(null);
    const itemRefs = ref([]);

    function selectSession(evt: {
        target: {
            value: string;
        };
    }) {
        const value = evt.target.value;
        if (value != "default") {
            const selectable = sessionsMetaStore.sessionSelectableCheck(value, props.scope);

            if (selectable) {
                const session = sessionsMetaStore.getSession(value, props.scope);

                if (session != null) {
                    emit("sessionSelected", session);
                    return;
                }
            }
        }

        selectDefaultOperation();
    }

    watch(props, () => {
        if (props.reset) {
            selectDefaultOperation();
        }
    });
    watch(sessions, () => {
        const cacheSelection = getSelection();

        selectDefaultOperation();

        // attempt to re-select for more streamline experience
        if (cacheSelection) {
            nextTick(() => {
                setTimeout(() => {
                    cacheSelection.click();
                    toastr.warning("Re-Selected for convenience");
                }, 400);
            });
        }
    });

    function getSelection(): HTMLSelectElement | null {
        let res = null as HTMLSelectElement | null;
        itemRefs.value.forEach((elem: HTMLSelectElement) => {
            if ((elem as any).checked) {
                res = elem;
            }
        });

        return res;
    }

    function selectDefaultOperation() {
        (selectDefault.value as any).checked = true;
        emit("sessionSelected", null);
    }
</script>

<template>
    <fieldset @change="(evt: any) =>  selectSession(evt)">
        <input
            type="radio"
            :id="'default_' + scope"
            :name="'sessions_select_' + scope"
            value="default"
            checked
            ref="selectDefault"
        />
        <label :for="'default_' + scope">{{ defaultSelectionLabel }}</label>

        <template v-for="session in sessions">
            <br />
            <input
                type="radio"
                :id="session.name + '_' + scope"
                :name="'sessions_select_' + scope"
                :value="session.name"
                ref="itemRefs"
            />
            <label :for="session.name + '_' + scope">{{ session.name }}</label>
        </template>
    </fieldset>
</template>

<style scoped></style>
