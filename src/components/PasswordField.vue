<script setup lang="ts">
    import { computed, ref } from "vue";
    import useKeysStore from "./../stores/keys";
    import useSessionsMetaStore from "./../stores/sessionsMeta";

    const keysStore = useKeysStore();
    const sessionsMetaStore = useSessionsMetaStore();

    const props = defineProps({
        scope: {
            type: String,
            default: "page",
        },
        hint: {
            type: String,
            required: true,
        },
        hintActivated: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
    });

    const internalPassword = ref(keysStore.getPassword(props.scope));

    async function performUpdate() {
        await keysStore.setKey(props.scope, internalPassword.value);
        await sessionsMetaStore.reParseLocalSessionCacheFromFiles(props.scope);
    }

    const memoryPasswordSet = computed(() => {
        let pw = keysStore.getPassword(props.scope);

        const res = pw != "";

        if (res) {
            internalPassword.value = "";
        }
        return res;
    });
</script>

<template>
    {{ description }}<br />
    <input
        type="password"
        style="width: 40%"
        :placeholder="memoryPasswordSet ? hintActivated : hint"
        v-model="internalPassword"
        :disabled="memoryPasswordSet"
    />
    <button
        @click="performUpdate"
        :style="{
            'background-color': memoryPasswordSet ? 'chartreuse' : '',
        }"
        style="margin-left: 1em"
    >
        Update
    </button>
</template>

<style scoped></style>
