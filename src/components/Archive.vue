<script setup lang="ts"></script>

<template>
    <RouterLink to="/"><h1>Batch Viewer for Reddit</h1></RouterLink>

    This uses the public part of the reddit api to get the information about posts. Be responsible and slow with your requests or
    you might get rate limited or blocked.

    <h2>Archive page</h2>
    <div>
        Proxy Server (See `README.md`, Needed because of CORS):
        <br />
        https://<input type="text" name="proxy_address" id="proxy_address" />:9376/
        <br />
        <br />
        Subreddit to scrape<br />
        <input type="text" id="subreddit_name" placeholder="mathmemes" value="mathmemes" /><br />
        Post to start with (shortlink shown by "old.reddit.com" format, e.g. "y3215w" in the case of https://redd.it/y3215w)<br />
        <input type="text" id="start_with_post" />
        <button id="generate_url_action">Generate URL</button>

        <br />
        <br />
        URL of the posts (old.reddit) because easier to see<br />
        <input type="text" id="url_output" disabled value="" style="width: 60%" />
        <button id="copy_to_clipboard">Copy to clipboard</button>
        <br />
        URL of the corresponding api endpoint<br />
        <input type="text" id="api_url_output" disabled value="" style="width: 60%" />

        <button id="process_posts" style="color: darkcyan">Process one set of Posts</button>

        <br />
        <br />
        Encryption key (If set, the output will be encrypted):<br />
        <input type="password" id="encryption_key" value="" style="width: 40%" placeholder="Encryption Key" />
        <button id="update_encryption_key">Update</button>

        <br />
        <br />
        Where to put the results:
        <fieldset>
            <input
                type="radio"
                id="default_page"
                name="sessions_select_page"
                value="default"
                class="selects_session"
                scope="page"
                checked
            />
            <label for="default_page">Download</label>
            <br />
            <div class="sessions_radio_buttons" scope="page"></div>
        </fieldset>
    </div>
</template>

<style scoped></style>