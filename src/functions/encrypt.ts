import useKeysStore from "./../stores/keys";
import { arrayBufferToHexString, hexStringToTypedArray } from "./hash";

// This is not really a proper way to use salt, but it is sufficient for this purpose.
// Secure implementation would require randomizing the salt, but that requires storing it also and I do not have the capability to do that
// This means passphrases need to be so complex that they cannot be attacked with dictionary attacks. Otherwise I cannot help you
const salt = new Uint8Array([254, 136, 190, 138, 248, 102, 91, 48, 137, 81, 219, 33, 227, 152, 66, 233]);

export async function keyFromPassword(password: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    return await crypto.subtle
        .importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits", "deriveKey"])
        .then(async (keyFromPassphrase) => {
            let key = await crypto.subtle.deriveKey(
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
            );
            return key;
        });
}

export async function encryptText(text: string, iv_string: string, scope: string = "page"): Promise<string> {
    if (!useKeysStore().encryptionOn(scope)) {
        return text;
    }

    let enc = new TextEncoder();
    let message = enc.encode(text);

    let cipherText: ArrayBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: ivStringToUint8Array(iv_string) },
        useKeysStore().getKey(scope),
        message
    );

    return arrayBufferToHexString(cipherText);
}

function ivStringToUint8Array(iv_string: string): Uint8Array {
    return hexStringToTypedArray(iv_string);
}

function uint8ArrayToIvString(array: Uint8Array): string {
    return arrayBufferToHexString(array);
}

export async function decryptText(text: string, iv_string: string, scope: string = "page") {
    if (!useKeysStore().encryptionOn(scope)) {
        return text;
    }

    let decrypted = new ArrayBuffer(0);
    try {
        decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: ivStringToUint8Array(iv_string) },
            useKeysStore().getKey(scope),
            hexStringToTypedArray(text)
        );
    } catch (error) {
        console.error("Error while decrypting text. Probably used the wrong key");
        throw new Error("Decryption Error");
    }

    let dec = new TextDecoder();
    return dec.decode(decrypted);
}

export async function encryptBlob(blob: Blob, iv_string: string, scope: string = "page"): Promise<Blob> {
    if (!useKeysStore().encryptionOn(scope)) {
        return blob;
    }

    const asArrayBuffer = await blob.arrayBuffer();
    return window.crypto.subtle
        .encrypt({ name: "AES-GCM", iv: ivStringToUint8Array(iv_string) }, useKeysStore().getKey(scope), asArrayBuffer)
        .then((buffer) => {
            let out_blob = new Blob([buffer], {
                type: blob.type,
            });

            return out_blob;
        });
}

export async function decryptBlob(blob: Blob, iv_string: string, scope: string = "page"): Promise<Blob> {
    if (!useKeysStore().encryptionOn(scope)) {
        return blob;
    }

    const asArrayBuffer = await blob.arrayBuffer();
    let res = new Blob();
    try {
        res = await crypto.subtle
            .decrypt({ name: "AES-GCM", iv: ivStringToUint8Array(iv_string) }, useKeysStore().getKey(scope), asArrayBuffer)
            .then((buffer) => {
                let out_blob = new Blob([buffer], {
                    type: blob.type,
                });

                return out_blob;
            });
    } catch (error) {
        console.error("error while decrypting blob. Probably used the wrong key");
    }
    return res;
}

export function getRandomIvString() {
    return uint8ArrayToIvString(crypto.getRandomValues(new Uint8Array(12)));
}
