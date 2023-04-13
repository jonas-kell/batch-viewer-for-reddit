function hash_blob(blob) {
    return new Promise(async (resolve, reject) => {
        const asArrayBuffer = await blob.arrayBuffer();

        crypto.subtle
            .digest("SHA-1", asArrayBuffer)
            .then((buffer) => {
                resolve(array_buffer_to_hex_string(buffer));
            })
            .catch(() => {
                reject();
            });
    });
}

function array_buffer_to_hex_string(buffer) {
    const typedArray = new Uint8Array(buffer);
    return Array.prototype.map.call(typedArray, (x) => ("00" + x.toString(16)).slice(-2)).join("");
}

function hex_string_to_typed_array(hex_string) {
    if (hex_string.length % 2 != 0) {
        console.error("hex string needs to have even length");
    }
    let size_in_bytes = Math.round(hex_string.length / 2); // should be devisible by 2, else something is fishy anyway

    const typedArray = new Uint8Array(size_in_bytes);
    for (let index = 0; index < size_in_bytes; index++) {
        typedArray[index] = Number("0x" + hex_string[2 * index] + hex_string[2 * index + 1]);
    }
    return typedArray;
}

var used_key = null;

// This is not really a proper way to use salt, but it is sufficent for this purpose.
// Secure implementation would require randomizing the salt, but that requires storing it also and I do not have the capability to do that
// This means passphrases need to be so complex that they cannot be attacked with dictionary attacks. Otherwise I cannot help you
const salt = new Uint8Array([254, 136, 190, 138, 248, 102, 91, 48, 137, 81, 219, 33, 227, 152, 66, 233]);

function encryption_on() {
    if (used_key == null) {
        return false;
    } else {
        return true;
    }
}

async function set_key_to_use(input_id, button_id) {
    $("#" + String(button_id)).attr("disabled", "disabled");
    var password = String(document.getElementById(input_id).value);

    if (password == "") {
        used_key = null;

        // show encryption is off
        $("#" + String(button_id)).css("background-color", "");
        console.log("Encryption disabled");

        // reactivate button
        $("#" + String(button_id)).attr("disabled", null);
    } else {
        const enc = new TextEncoder();
        await crypto.subtle
            .importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits", "deriveKey"])
            .then(async (keyFromPassphrase) => {
                await crypto.subtle
                    .deriveKey(
                        {
                            name: "PBKDF2",
                            salt: salt,
                            iterations: 100000,
                            hash: "SHA-256",
                        },
                        keyFromPassphrase,
                        {
                            name: "AES-GCM",
                            length: 256,
                        },
                        false,
                        ["encrypt", "decrypt"]
                    )
                    .then(async (encryptionKey) => {
                        used_key = encryptionKey;

                        // show encryption is on
                        $("#" + String(button_id)).css("background-color", "chartreuse");
                        $("#" + String(input_id)).val("");
                        console.log("Encryption key set and enabled");

                        // reactivate button
                        $("#" + String(button_id)).attr("disabled", null);
                    });
            });
    }
}

async function encrypt_text(text, iv_string) {
    if (!encryption_on()) {
        return text;
    }

    let enc = new TextEncoder();
    let message = enc.encode(text);

    ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv_string_to_uint8array(iv_string) }, used_key, message);

    return array_buffer_to_hex_string(ciphertext);
}

async function decrypt_text(text, iv_string) {
    if (!encryption_on()) {
        return text;
    }

    let decrypted = "";
    try {
        decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv_string_to_uint8array(iv_string) },
            used_key,
            hex_string_to_typed_array(text)
        );
    } catch (error) {
        console.error("error while decrypting text. Probably used the wrong key");
        return "Decryption Error";
    }

    let dec = new TextDecoder();
    return dec.decode(decrypted);
}

function encrypt_blob(blob, iv_string) {
    if (!encryption_on()) {
        return blob;
    }

    return new Promise(async (resolve, reject) => {
        const asArrayBuffer = await blob.arrayBuffer();

        window.crypto.subtle
            .encrypt({ name: "AES-GCM", iv: iv_string_to_uint8array(iv_string) }, used_key, asArrayBuffer)
            .then((buffer) => {
                let out_blob = new Blob([buffer], {
                    type: blob.type,
                });

                resolve(out_blob);
            })
            .catch(() => {
                reject();
            });
    });
}

function decrypt_blob(blob, iv_string) {
    if (!encryption_on()) {
        return blob;
    }

    return new Promise(async (resolve, reject) => {
        const asArrayBuffer = await blob.arrayBuffer();

        try {
            crypto.subtle
                .decrypt({ name: "AES-GCM", iv: iv_string_to_uint8array(iv_string) }, used_key, asArrayBuffer)
                .then((buffer) => {
                    let out_blob = new Blob([buffer], {
                        type: blob.type,
                    });

                    resolve(out_blob);
                })
                .catch(() => {
                    console.error("error while decrypting blob. Probably used the wrong key");
                    reject();
                });
        } catch (error) {
            console.error("error while decrypting blob. Probably used the wrong key");
        }
    });
}

function iv_string_to_uint8array(iv_string) {
    return hex_string_to_typed_array(iv_string);
}

function uint8array_to_iv_string(array) {
    return array_buffer_to_hex_string(array);
}
