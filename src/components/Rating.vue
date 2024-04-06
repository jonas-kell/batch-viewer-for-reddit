<script setup lang="ts">
    defineProps({
        ratingStars: {
            required: true,
            type: Number,
        },
    });

    const emit = defineEmits(["new-rating-selected"]);

    function handleRatingChange(newRating: number) {
        emit("new-rating-selected", newRating);
    }
</script>

<template>
    <div style="width: 100%; text-align: center" :key="ratingStars">
        <span
            v-for="i in 5"
            class="favourite_star"
            :class="{
                active: i <= ratingStars,
                inactive: i > ratingStars,
            }"
            @click="handleRatingChange(i)"
        ></span>
    </div>
</template>

<style scoped>
    span.favourite_star {
        background-repeat: no-repeat;
        background-size: 80% 80%;
        background-position: center;
        width: 1.5em;
        height: 1.5em;
        cursor: pointer;
        display: inline-block;
    }

    span.favourite_star.active,
    span.favourite_star.inactive:hover {
        background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CgogPGc+CiAgPHRpdGxlPmJhY2tncm91bmQ8L3RpdGxlPgogIDxyZWN0IGZpbGw9Im5vbmUiIGlkPSJjYW52YXNfYmFja2dyb3VuZCIgaGVpZ2h0PSI0MDIiIHdpZHRoPSI1ODIiIHk9Ii0xIiB4PSItMSIvPgogPC9nPgogPGc+CiAgPHRpdGxlPkxheWVyIDE8L3RpdGxlPgogIDxwYXRoIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2U9IiMwMDAwMDAiIGZpbGw9IiNmZmZmMDAiIGlkPSJzdmdfMSIgZD0ibTE2LjcsMi41bDMuMSw5LjNjMC4xLDAuMyAwLjQsMC41IDAuNywwLjVsOS45LDBjMC43LDAgMC45LDAuOCAwLjQsMS4ybC04LDUuN2MtMC4yLDAuMiAtMC4zLDAuNSAtMC4yLDAuOGwzLjEsOS4zYzAuMiwwLjYgLTAuNSwxLjEgLTEuMSwwLjhsLTgsLTUuN2MtMC4yLC0wLjIgLTAuNiwtMC4yIC0wLjgsMGwtOCw1LjdjLTAuNSwwLjQgLTEuMywtMC4xIC0xLjEsLTAuOGwzLjEsLTkuM2MwLjEsLTAuMyAwLC0wLjYgLTAuMiwtMC44bC04LC01LjdjLTAuOSwtMC41IC0wLjYsLTEuMyAwLjEsLTEuM2w5LjksMGMwLjMsMCAwLjYsLTAuMiAwLjcsLTAuNWwzLjEsLTkuM2MwLjIsLTAuNiAxLC0wLjYgMS4zLDAuMXoiIGNsYXNzPSJzdDAiLz4KIDwvZz4KPC9zdmc+);
    }

    span.favourite_star.inactive,
    span.favourite_star.active:hover {
        background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaWQ9IkxheWVyXzEiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDMyIDMyOyIgdmVyc2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgMzIgMzIiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2ZpbGw6bm9uZTtzdHJva2U6IzAwMDAwMDtzdHJva2Utd2lkdGg6MjtzdHJva2UtbWl0ZXJsaW1pdDoxMDt9Cjwvc3R5bGU+PHBhdGggY2xhc3M9InN0MCIgZD0iTTE2LjcsMi41bDMuMSw5LjNjMC4xLDAuMywwLjQsMC41LDAuNywwLjVoOS45YzAuNywwLDAuOSwwLjgsMC40LDEuMmwtOCw1LjdjLTAuMiwwLjItMC4zLDAuNS0wLjIsMC44bDMuMSw5LjMgIGMwLjIsMC42LTAuNSwxLjEtMS4xLDAuOGwtOC01LjdjLTAuMi0wLjItMC42LTAuMi0wLjgsMGwtOCw1LjdjLTAuNSwwLjQtMS4zLTAuMS0xLjEtMC44bDMuMS05LjNjMC4xLTAuMywwLTAuNi0wLjItMC44bC04LTUuNyAgQzAuNywxMywxLDEyLjIsMS43LDEyLjJoOS45YzAuMywwLDAuNi0wLjIsMC43LTAuNWwzLjEtOS4zQzE1LjYsMS44LDE2LjQsMS44LDE2LjcsMi41eiIvPjwvc3ZnPg==);
    }
</style>
