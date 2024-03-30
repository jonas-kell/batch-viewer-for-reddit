import { saveAs } from "file-saver";
import toastr from "toastr";

export function copyToClipboard(text = "") {
    navigator.clipboard.writeText(text);
}

export function downloadBlob(blob: Blob, filename: string) {
    // Download see FileSaver.js
    saveAs(blob, filename);
    toastr.info("Downloaded: " + filename);
}

export async function fileSystemAccessApiPicker(): Promise<[File, string]> {
    let fileHandle;
    [fileHandle] = await (window as any).showOpenFilePicker();
    const file = await fileHandle.getFile();
    const filename = file.name;

    return [file, filename];
}
