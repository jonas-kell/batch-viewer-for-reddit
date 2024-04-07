<script setup lang="ts">
    import { Ref, ref, watch } from "vue";
    import { Filter, getLastUsedFilter, storeFilterToLocalStorage } from "./../functions/filter";

    const emit = defineEmits(["new-filter"]);

    const filter: Ref<Filter> = ref(getLastUsedFilter());

    watch(
        filter,
        () => {
            emit("new-filter", filter.value);
            storeFilterToLocalStorage(filter.value);
        },
        {
            deep: true,
            immediate: true,
        }
    );

    function resetFilter() {
        filter.value = getLastUsedFilter(true);
    }

    const visible = ref(false);
</script>

<template>
    <div>
        <h3>
            <span style="cursor: pointer" @click="visible = !visible">Filters <span v-if="!visible">&#9776; </span></span>

            <button @click="resetFilter" v-if="visible" style="margin-left: 2em">Reset</button>
        </h3>

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
