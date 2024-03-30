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

    function performUpdate() {
        keysStore.setKey(props.scope, internalPassword.value);
        internalPassword.value = "";
    }

    const memoryPasswordSet = computed(() => {
        let pw = keysStore.getPassword(props.scope);

        return pw != "";
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
