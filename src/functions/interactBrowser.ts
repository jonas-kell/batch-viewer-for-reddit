import { saveAs } from "file-saver";

export function copyToClipboard(text = "") {
    navigator.clipboard.writeText(text);
}

export function downloadBlob(blob: Blob, filename: string) {
    // Download see FileSaver.js
    saveAs(blob, filename);
    toastr.info("Downloaded: " + filename);
}
