export interface Post {
    hash_filename: string;
    iv_string: string;
    mime_type: string;
    series_index: string;
    zip_file_name: string;
    id: string;
    author: string;
    direct_link: string;
    title: string;
    media_url: string;
    subreddit: string;
    rating?: Rating;
}

export interface Rating {
    stars: string;
}

export function getRating(post: Post): Rating {
    if (post.rating == undefined || post.rating == null || !post.rating) {
        let newRating: Rating = {
            stars: "0",
        };
        post.rating = newRating;
    }

    if (post.rating.stars == undefined || post.rating.stars == null || !post.rating.stars) {
        post.rating.stars = "0";
    }

    return post.rating; // now definitely set
}

export interface FileMetaEntry {
    size: number;
    name: string;
}

export interface FileMeta {
    [key: string]: FileMetaEntry;
}

export interface MemorySession {
    is_encrypted: boolean;
    iv_string: string;
    can_be_decrypted: boolean;
    name: string;
    posts: { [key: string]: Post };
    file_meta: FileMeta;
    session: StoredSession;
}

export interface StoredSession {
    encryption_test: string;
    encrypted: boolean;
    posts: { [key: string]: Post | string }; // Post if un-encrypted, string if encrypted.
    name: string;
    iv_string: string;
    file_meta: FileMeta;
}
