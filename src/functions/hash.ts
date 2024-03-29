export function hashBlob(blob: Blob) {
    return new Promise<string>(async (resolve, reject) => {
        const asArrayBuffer = await blob.arrayBuffer();

        crypto.subtle
            .digest("SHA-1", asArrayBuffer)
            .then((buffer) => {
                resolve(arrayBufferToHexString(buffer));
            })
            .catch(() => {
                reject();
            });
    });
}

export function arrayBufferToHexString(buffer: ArrayBuffer): string {
    const typedArray = new Uint8Array(buffer);
    return Array.prototype.map.call(typedArray, (x) => ("00" + x.toString(16)).slice(-2)).join("");
}

export function hexStringToTypedArray(hexString: string): Uint8Array {
    if (hexString.length % 2 != 0) {
        console.error("hex string needs to have even length");
    }
    let sizeInBytes = Math.round(hexString.length / 2); // should be divisible by 2, else something is fishy anyway

    const typedArray = new Uint8Array(sizeInBytes);
    for (let index = 0; index < sizeInBytes; index++) {
        typedArray[index] = Number("0x" + hexString[2 * index] + hexString[2 * index + 1]);
    }
    return typedArray;
}

export function blobToBase64(blob: Blob) {
    return new Promise<string>((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });
}
