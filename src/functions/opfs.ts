let sessionsMeta = {};
let selectedSessionNames = {};

async function getSessionDirectoryHandle() {
    const originPrivateFileSystem = await navigator.storage.getDirectory();
    const sessionDirHandle = await originPrivateFileSystem.getDirectoryHandle("session-storage", { create: true });

    return sessionDirHandle;
}

async function getSessionPostsDirectoryHandle(session_name = "", scope = "page") {
    if (session_name == "") {
        session_name = getSelectedSessionName(scope);
    }

    if (session_name != "") {
        const originPrivateFileSystem = await navigator.storage.getDirectory();
        const sessionDirHandle = await originPrivateFileSystem.getDirectoryHandle(session_name.split(".")[0], {
            create: true,
        });

        return sessionDirHandle;
    }
    return null;
}

function selectSession(session_name = "", scope = "page") {
    delete selectedSessionNames[scope];
    if (session_name == "") {
        console.log(scope);
        $(`#default_${scope}`).prop("checked", true);
        return false;
    }

    if (Object.keys(sessionsMeta[scope]).includes(session_name)) {
        if (sessionsMeta[scope][session_name].can_be_decrypted ?? false) {
            selectedSessionNames[scope] = session_name;
            return true;
        } else {
            toastr.error("Encrypted session can not be selected without key");
        }
    } else {
        if (session_name != "default") {
            toastr.error("Key not found in sessionsMeta cache");
        } else {
            toastr.success("Selected default operation");
        }
    }
    $(`#default_${scope}`).prop("checked", true);
    return false;
}

function getSelectedSession(scope = "page") {
    return getSession(getSelectedSessionName(scope), scope);
}

function getSession(session_name, scope = "page") {
    let obj = sessionsMeta[scope] ?? {};
    let res = obj[session_name];

    if (res != undefined) {
        return res;
    }
    return null;
}

function getSelectedSessionName(scope = "page") {
    return selectedSessionNames[scope] ?? "";
}

async function recreateSessionsMeta(scope = "page") {
    const sessionDirHandle = await getSessionDirectoryHandle();

    sessionsMeta[scope] = {};

    // rebuild sessions array
    for await (const entry of sessionDirHandle.values()) {
        if ((entry.kind = "file" && entry.name.match(/Session_\d*(_encrypted)?.json/g))) {
            const file = await entry.getFile();

            // parse info
            let parsedSession = JSON.parse(await file.text());
            const is_encrypted = parsedSession.encrypted;
            const session_iv_string = parsedSession.iv_string;
            let throws_error = false;
            try {
                await decryptText(parsedSession.encryption_test, session_iv_string, scope);
            } catch (error) {
                throws_error = true;
            }
            const can_be_decrypted = !is_encrypted || (is_encrypted && encryptionOn(scope) && !throws_error);

            // decrypt posts
            let posts = {};
            if (encryptionOn(scope) && can_be_decrypted && is_encrypted) {
                // need to decrypt
                for (const post_id_enc in parsedSession.posts) {
                    const post_id = await decryptText(post_id_enc, session_iv_string, scope);
                    const post_object = JSON.parse(await decryptText(parsedSession.posts[post_id_enc], session_iv_string, scope));
                    posts[post_id] = await decryptPostObject(post_object, scope);
                }
            } else {
                // just do a copy
                posts = JSON.parse(JSON.stringify(parsedSession.posts));
            }

            // store results
            sessionsMeta[scope][parsedSession.name] = {
                name: parsedSession.name,
                is_encrypted: is_encrypted,
                iv_string: session_iv_string,
                can_be_decrypted: can_be_decrypted,
                posts: posts,
                file_meta: JSON.parse(JSON.stringify(parsedSession.file_meta)),
                session: parsedSession,
            };
        }
    }

    return sessionsMeta[scope];
}

async function createSession(scope = "page") {
    const filename = "Session_" + String(Date.now()) + (encryptionOn(scope) ? "_encrypted" : "") + ".json";
    const sessionDirHandle = await getSessionDirectoryHandle();
    const sessionFileHandle = await sessionDirHandle.getFileHandle(filename, {
        create: true,
    });
    const writable = await sessionFileHandle.createWritable();
    const iv_string = uint8ArrayToIvString(crypto.getRandomValues(new Uint8Array(12)));

    await writable.write(
        `{"name": "${filename}", "encrypted": ${encryptionOn(scope)}, "encryption_test": "${await encryptText(
            String(Math.random()),
            iv_string,
            scope
        )}", "iv_string": "${iv_string}", "posts": {}, "file_meta": {}}`
    );
    await writable.close();
}

async function deleteSession(fileNameToDelete) {
    const sessionDirHandle = await getSessionDirectoryHandle();
    await sessionDirHandle.removeEntry(fileNameToDelete);

    const dataDirHandle = await getSessionPostsDirectoryHandle(fileNameToDelete); // !! scope does not need to be set, because fileNameToDelete is
    await (await navigator.storage.getDirectory()).removeEntry(dataDirHandle.name, { recursive: true });

    toastr.success(`Deleted Session ${fileNameToDelete}`);
}

async function storeDataFileInSelectedSessionsOpfsFolder(file, scope = "page") {
    const filename = file.name;
    const dataDirHandle = await getSessionPostsDirectoryHandle("", scope);

    // check if can be processed
    let session = getSelectedSession(scope);
    if (session == null) {
        toastr.error("No session selected, aborting");
        return;
    }
    let filenames = await getCurrentSessionDataFilesNames(scope);
    if (filenames.includes(filename)) {
        toastr.warning("Already included file: " + filename);
        return;
    }
    const file_encrypted = filename.includes("_encrypted");
    const encryption_enabled = encryptionOn(scope);
    if (encryption_enabled != file_encrypted) {
        toastr.error("Encryption mismatch for file: " + filename);
        return;
    }

    // process meta
    let meta_info = null;
    try {
        meta_info = await readInZipFile(file, scope);
    } catch (error) {
        toastr.error("Decryption Key mismatch for file: " + filename);
        return;
    }

    // append posts
    for (let post of meta_info) {
        post.zip_file_name = filename; // remember what file the post is from
        session.posts[post.id] = post;
    }

    // store file in opfs
    const dataFileHandle = await dataDirHandle.getFileHandle(filename, {
        create: true,
    });
    const writable = await dataFileHandle.createWritable();
    await writable.write(file);
    await writable.close();

    // get and store file meta
    const reloaded_file = await dataFileHandle.getFile();
    session.file_meta[filename] = { size: reloaded_file.size, name: filename };

    await storeCurrentSessionToOpfs(scope);
}

async function getSessionDataFilesMeta(session_name, scope = "page") {
    let session = getSession(session_name, scope);
    if (session == null) {
        return {};
    }

    return session.file_meta;
}

async function getSessionDataFilesNames(session_name, scope = "page") {
    return Object.keys(await getSessionDataFilesMeta(session_name, scope));
}

async function getCurrentSessionDataFilesNames(scope = "page") {
    return await getSessionDataFilesNames(getSelectedSessionName(scope), scope);
}

async function getSessionNumberOfDataFileNames(session_name, scope = "page") {
    return (await getSessionDataFilesNames(session_name, scope)).length;
}

async function getSessionDataFileCompleteSize(session_name, scope = "page") {
    const meta = await getSessionDataFilesMeta(session_name, scope);
    let size = 0;

    for (const file_name in meta) {
        size += meta[file_name].size;
    }

    return size;
}

async function storeCurrentSessionToOpfs(scope = "page") {
    let session = getSelectedSession(scope);
    if (session == null) {
        throw new Error("No Session selected");
    }

    const filename = getSelectedSessionName(scope);
    const sessionDirHandle = await getSessionDirectoryHandle();
    const sessionFileHandle = await sessionDirHandle.getFileHandle(filename);
    const writable = await sessionFileHandle.createWritable();
    const session_iv_string = session.iv_string;

    if (encryptionOn(scope)) {
        // encrypt posts for storage
        session.session.posts = {};

        for (const post_id_unenc in session.posts) {
            const post_unenc = session.posts[post_id_unenc];

            const post_id_enc = await encryptText(post_id_unenc, session_iv_string, scope);
            const post_enc = await encryptText(
                JSON.stringify(await encryptPostObject(post_unenc, scope)),
                session_iv_string,
                scope
            );

            session.session.posts[post_id_enc] = post_enc;
        }
    } else {
        session.session.posts = session.posts; // set to the overwritten version
    }

    session.session.file_meta = session.file_meta; // set to the overwritten version

    await writable.write(JSON.stringify(session.session));
    await writable.close();

    toastr.success("Session data stored to File System");
}

async function readInZipFile(file, scope = "page") {
    let post_json = [];

    await JSZip.loadAsync(file).then(async function (zip) {
        let contents = zip.files["contents.json"];
        let json = JSON.parse(await contents.async("text"));

        // decrypt stuff
        if (encryptionOn(scope)) {
            for (let j = 0; j < json.length; j++) {
                json[j] = await decryptPostObject(json[j], scope);
            }
        }

        for (let j = 0; j < json.length; j++) {
            post_json.push(json[j]);
        }
    });

    return post_json;
}

async function decryptPostObject(post, scope = "page") {
    let result_post = {};

    // clone
    for (const keyword of ["hash_filename", "iv_string", "mime_type", "series_index", "zip_file_name"]) {
        if (post[keyword] != undefined) {
            result_post[keyword] = post[keyword];
        }
    }

    // decrypt
    for (const keyword of ["id", "author", "direct_link", "title", "media_url", "subreddit"]) {
        let result = "";
        try {
            result = await decryptText(post[keyword], post["iv_string"] ?? "", scope);
        } catch (error) {
            if (keyword == "id") {
                throw new Error("Current Key not suited for file decryption");
            }
        }
        result_post[keyword] = result;
    }

    return result_post;
}

async function encryptPostObject(post, scope = "page") {
    let result_post = {};

    // clone
    for (const keyword of ["hash_filename", "iv_string", "mime_type", "series_index", "zip_file_name"]) {
        if (post[keyword] != undefined) {
            result_post[keyword] = post[keyword];
        }
    }

    // decrypt
    for (const keyword of ["id", "author", "direct_link", "title", "media_url", "subreddit"]) {
        result_post[keyword] = await encryptText(post[keyword], post["iv_string"] ?? "", scope);
    }

    return result_post;
}

function sizeToString(size: number) {
    return (size * 1e-6).toFixed(3) + " MB";
}
