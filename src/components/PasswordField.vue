<script setup lang="ts">
    import { computed, ref } from "vue";
    import useKeysStore from "./../stores/keys";

    const keysStore = useKeysStore();

    const props = defineProps({
        scope: {
            type: String,
            default: "page",
        },
        hint: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: "Decryption key (If input is encrypted, this needs to be set):",
        },
    });

    const internalPassword = ref(keysStore.getPassword(props.scope));

    function performUpdate() {
        keysStore.setKey(props.scope, internalPassword.value);
    }

    const memoryPasswordSet = computed(() => {
        let pw = keysStore.getPassword(props.scope);

        return pw != "";
    });
</script>

<template>
    {{ description }}<br />
    <input type="password" style="width: 40%" :placeholder="hint" v-model="internalPassword" />
    <button
        @click="performUpdate"
        :style="{
            'background-color': memoryPasswordSet ? 'chartreuse' : '',
        }"
    >
        Update
    </button>
</template>

<style scoped></style>
