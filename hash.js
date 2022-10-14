function hash_blob(blob) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();

        fileReader.addEventListener("load", () => {
            crypto.subtle.digest("SHA-1", fileReader.result).then((buffer) => {
                const typedArray = new Uint8Array(buffer);
                resolve(Array.prototype.map.call(typedArray, (x) => ("00" + x.toString(16)).slice(-2)).join(""));
            });
        });
        fileReader.addEventListener("error", () => {
            reject(fileReader.error);
        });

        fileReader.readAsArrayBuffer(blob);
    });
}
