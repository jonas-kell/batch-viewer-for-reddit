function hash_blob(blob) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();

        fileReader.addEventListener("load", () => {
            crypto.subtle.digest("SHA-1", fileReader.result).then((buffer) => {
                resolve(array_buffer_to_hex_string(buffer));
            });
        });
        fileReader.addEventListener("error", () => {
            reject(fileReader.error);
        });

        fileReader.readAsArrayBuffer(blob);
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
// This means passphrases need to be so complex that they cennot be attacked with dictionary attacks. Otherwise I cannot help you
const salt = new Uint8Array([254, 136, 190, 138, 248, 102, 91, 48, 137, 81, 219, 33, 227, 152, 66, 233]);
const iv = new Uint8Array([215, 36, 78, 238, 29, 208, 95, 40, 18, 30, 124, 64]);

function encryption_on() {
    if (used_key == null) {
        return false;
    } else {
        return true;
    }
}

function set_key_to_use(input_id, button_id) {
    $("#" + String(button_id)).attr("disabled", "disabled");
    var password = String(document.getElementById(input_id).value);

    if (password == "") {
        used_key = null;
        $("#" + String(button_id)).attr("disabled", null);
        console.log("Encryption disabled");
    } else {
        const enc = new TextEncoder();
        window.crypto.subtle
            .importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits", "deriveKey"])
            .then((keyFromPassphrase) => {
                window.crypto.subtle
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
                    .then((encryptionKey) => {
                        used_key = encryptionKey;
                        console.log("Encryption key set");
                        $("#" + String(button_id)).attr("disabled", null);
                    });
            });
    }
}

async function encrypt_text(text) {
    if (!encryption_on()) {
        return text;
    }

    let enc = new TextEncoder();
    let message = enc.encode(text);

    ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, used_key, message);

    return array_buffer_to_hex_string(ciphertext);
}

async function decrypt_text(text) {
    if (!encryption_on()) {
        return text;
    }

    let decrypted = "";
    try {
        decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, used_key, hex_string_to_typed_array(text));
    } catch (error) {
        console.error("error while decrypting text. Probably used the wrong key");
        return "Decryption Error";
    }

    let dec = new TextDecoder();
    return dec.decode(decrypted);
}
