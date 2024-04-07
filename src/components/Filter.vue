<script setup lang="ts">
    import { Ref, ref, watch } from "vue";
    import { Filter, defaultFilter } from "./../functions/filter";

    const emit = defineEmits(["new-filter"]);

    const filter: Ref<Filter> = ref(defaultFilter);

    watch(
        filter,
        () => {
            emit("new-filter", filter.value);
        },
        {
            deep: true,
            immediate: true,
        }
    );

    const visible = ref(false);
</script>

<template>
    <div>
        <h3 style="cursor: pointer" @click="visible = !visible">Filters</h3>
        <div style="width: 100%; text-align: center" v-if="visible">
            Min-Stars: <input type="number" min="0" max="6" step="1" style="width: 20%" v-model="filter.minStars" />
            <br />
            <label for="allowUnratedFilter">Allow Unrated: </label>
            <input id="allowUnratedFilter" type="checkbox" v-model="filter.allowZeroStars" />
            <br />
            Search: <input type="text" style="width: 50%" v-model.lazy="filter.searchBar" />
        </div>
    </div>
</template>

<style scoped></style>
