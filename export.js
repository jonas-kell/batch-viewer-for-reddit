let archived_count = 0;
let count = 0;

$(document).ready(async () => {
    document.getElementById("update_input_decryption_key").addEventListener("click", async () => {
        await set_key_to_use("input_decryption_key", "update_input_decryption_key");

        selectSession("datainput"); // clear input scope session
    });

    document.getElementById("update_output_encryption_key").addEventListener("click", async () => {
        await set_key_to_use("output_encryption_key", "update_output_encryption_key");

        selectSession("dataoutput"); // clear output scope session
    });
});
