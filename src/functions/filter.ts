import { Post, getRating } from "./interfaces";

export interface Filter {
    searchBar: string; // TODO
    minStars: number;
    allowZeroStars: boolean;
}

export const defaultFilter: Filter = {
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
