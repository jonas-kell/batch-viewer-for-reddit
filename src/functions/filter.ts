import { Post, getRating } from "./interfaces";

export interface Filter {
    searchBar: string; // TODO
    minStars: number;
    allowZeroStars: boolean;
}

const defaultFilter: Filter = {
    allowZeroStars: true,
    searchBar: "",
    minStars: 0,
};

export function filteredPosts(posts: { [key: string]: Post }, filter: Filter): { [key: string]: Post } {
    let res: { [key: string]: Post } = {};

    for (const key in posts) {
        const postToFilter = posts[key];
        const ratingToFilter = getRating(postToFilter);
        const starsToFilter = parseInt(ratingToFilter.stars);

        if ((starsToFilter == 0 && filter.allowZeroStars) || starsToFilter >= filter.minStars) {
            if (
                filter.searchBar == "" ||
                (filter.searchBar != "" &&
                    (postToFilter.author.toLowerCase().includes(filter.searchBar.toLowerCase()) ||
                        postToFilter.subreddit.toLowerCase().includes(filter.searchBar.toLowerCase()) ||
                        postToFilter.title.toLowerCase().includes(filter.searchBar.toLowerCase())))
            ) {
                res[key] = postToFilter;
            }
        }
    }

    return res;
}

export function storeFilterToLocalStorage(filter: Filter) {
    localStorage.setItem("filterStarCount", String(filter.minStars));
    localStorage.setItem("filterAllowZeroStars", String(filter.allowZeroStars));
}

export function getLastUsedFilter(reset: boolean = false): Filter {
    if (reset) {
        storeFilterToLocalStorage(defaultFilter);
        return defaultFilter;
    }

    return {
        allowZeroStars: (localStorage.getItem("filterAllowZeroStars") ?? String(defaultFilter.allowZeroStars)) == "true",
        minStars: parseInt(localStorage.getItem("filterStarCount") ?? String(defaultFilter.minStars)),
        searchBar: defaultFilter.searchBar, // do not store search bar, non-encrypted info and annoying if kept
    };
}
