var test = null;

$(document).ready(() => {
    document.getElementById("generate_url_action").addEventListener("click", () => {
        var subreddit_name = document.getElementById("subreddit_name").value;
        var start_with_post = document.getElementById("start_with_post").value;

        document.getElementById("url_output").value = scrape_subreddit_url(subreddit_name, start_with_post);
    });

    document.getElementById("copy_to_clipboard").addEventListener("click", () => {
        copy_to_clipboard(document.getElementById("url_output").value);
    });

    document.getElementById("process_html").addEventListener("click", () => {
        var html = document.getElementById("html_input").value;

        if (html != "") {
            console.log("Processing HTML...");
            process_html(html);
        }
    });
});

function scrape_subreddit_url(subreddit_name = "", start_with_post = "", number_of_posts = 25) {
    var start_with_specific_post = start_with_post != "" && start_with_post.length == 6;

    console.log(
        `URL for scraping subreddit "${subreddit_name}" for ${number_of_posts} posts` +
            (start_with_specific_post ? ` after the post with the id ${start_with_post}` : "")
    );

    var url = `https://old.reddit.com/r/${subreddit_name}/?count=0${
        start_with_specific_post ? `&after=t3_${start_with_post}` : ""
    }`;

    return url;
}

function process_html(html = "") {
    var newHTMLDocument = document.implementation.createHTMLDocument("process");
    var elem = newHTMLDocument.createElement("div");
    elem.innerHTML = html;

    jqueryElem = $(elem);

    var output_array = [];
    // find the elements that start with the known id prefix
    jqueryElem.find("[id^=thing_t3_]:not(.promoted):not(.stickied)").each((index, element) => {
        element = $(element);

        // extract metadata
        var post_id = element.attr("id").substring(9);
        var post_title = element.find(".title .title").first().text();
        var image_url = parse_for_image_url(element);

        if (image_url != "") {
            output_array.push({
                id: post_id,
                direct_link: `https://redd.it/${post_id}`,
                title: post_title,
                image_link: image_url,
            });
        }
    });

    console.log(output_array);
}

function copy_to_clipboard(text = "") {
    navigator.clipboard.writeText(text);
}

function parse_for_image_url(jqueryElem) {
    var url = "";

    if (jqueryElem.html().includes("i.redd.it") || jqueryElem.html().includes("i.imgur.com")) {
        url = jqueryElem.attr("data-url");
    }

    return url;
}
