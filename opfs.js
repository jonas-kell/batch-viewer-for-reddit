let sessionsMeta = {};
let selected_session_name = "";

async function getSessionDirectoryHandle() {
    const originPrivateFileSystem = await navigator.storage.getDirectory();
    const sessionDirHandle = await originPrivateFileSystem.getDirectoryHandle("session-storage", { create: true });

    return sessionDirHandle;
}

async function getSessionPostsDirectoryHandle(session_name = "") {
    if (session_name == "") {
        session_name = selected_session_name;
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

function selectSession(session_name = "") {
    selected_session_name = "";
    if (session_name == "") {
        return false;
    }

    if (Object.keys(sessionsMeta).includes(session_name)) {
        if (sessionsMeta[session_name].can_be_decrypted ?? false) {
            selected_session_name = session_name;
            return true;
        } else {
            toastr.error("Encrypted session can not be selected without key");
        }
    } else {
        toastr.error("Key not found in sessionsMeta cache");
    }
    return false;
}

function getSelectedSession() {
    let res = sessionsMeta[selected_session_name];

    if (res != undefined) {
        return res;
    }
    return null;
}

function getSelectedSessionName() {
    return selected_session_name;
}

async function recreateSessionsMeta() {
    const sessionDirHandle = await getSessionDirectoryHandle();

    sessionsMeta = {};

    // rebuild sessions array
    for await (const entry of sessionDirHandle.values()) {
        if ((entry.kind = "file" && entry.name.match(/Session_\d*.json/g))) {
            const file = await entry.getFile();

            // parse info
            let parsedSession = JSON.parse(await file.text());
            const is_encrypted = parsedSession.encrypted;
            const iv_string = parsedSession.iv_string;
            const can_be_decrypted =
                !is_encrypted ||
                (is_encrypted &&
                    encryption_on() &&
                    (await decrypt_text(parsedSession.encryption_test, iv_string)) != "Decryption Error");

            // store results
            sessionsMeta[parsedSession.name] = {
                name: parsedSession.name,
                is_encrypted: is_encrypted,
                iv_string: iv_string,
                can_be_decrypted: can_be_decrypted,
                session: parsedSession,
            };
        }
    }

    return sessionsMeta;
}

async function createSession() {
    const filename = "Session_" + String(Date.now()) + ".json";
    const sessionDirHandle = await getSessionDirectoryHandle();
    const sessionFileHandle = await sessionDirHandle.getFileHandle(filename, {
        create: true,
    });
    const writable = await sessionFileHandle.createWritable();
    const iv_string = uint8array_to_iv_string(crypto.getRandomValues(new Uint8Array(12)));

    await writable.write(
        `{"name": "${filename}", "encrypted": ${encryption_on()}, "encryption_test": "${await encrypt_text(
            String(Math.random()),
            iv_string
        )}", "iv_string": "${iv_string}", "posts": []}`
    );
    await writable.close();
}

async function deleteSession(fileNameToDelete) {
    const sessionDirHandle = await getSessionDirectoryHandle();
    await sessionDirHandle.removeEntry(fileNameToDelete);

    const dataDirHandle = await getSessionPostsDirectoryHandle(fileNameToDelete);
    await (await navigator.storage.getDirectory()).removeEntry(dataDirHandle.name, { recursive: true });

    toastr.success(`Deleted Session ${fileNameToDelete}`);
}

async function storeDataFileInSelectedSessionsOpfsFolder(file) {
    const filename = file.name;
    const dataDirHandle = await getSessionPostsDirectoryHandle();
    const dataFileHandle = await dataDirHandle.getFileHandle(filename, {
        create: true,
    });
    const writable = await dataFileHandle.createWritable();

    await writable.write(file);
    await writable.close();
}

async function getCurrentSessionDataFilesNames() {
    let session = getSelectedSession();
    if (session == null) {
        return [];
    }

    let res = [];
    const dataDirHandle = await getSessionPostsDirectoryHandle();
    for await (const dateEntry of dataDirHandle.values()) {
        if ((dateEntry.kind = "file" && dateEntry.name.match(/[a-z]+_\d+(_encrypted)?.zip/g))) {
            res.push(dateEntry.name);
        }
    }

    return res;
}
