<script setup lang="ts"></script>

<template>
    <RouterLink to="/"><h1>Batch Viewer for Reddit</h1></RouterLink>

    <h2>Export Sessions</h2>
    <br /><br />

    <h3>Input Sessions</h3>
    Decryption key (Needed if the input Session is encrypted):<br />
    <input type="password" id="input_decryption_key" value="" style="width: 40%" placeholder="Decryption Key" />
    <button id="update_input_decryption_key" scope="inputdata">Update</button>
    <br />
    <br />
    <div>
        <fieldset>
            <input
                type="radio"
                id="default_inputdata"
                name="sessions_select_inputdata"
                value="default"
                class="selects_session"
                scope="inputdata"
                checked
            />
            <label for="default_inputdata">Please Choose Session</label>
            <br />
            <div class="sessions_radio_buttons" scope="inputdata"></div>
        </fieldset>
    </div>

    <br /><br />
    <h3>Output Sessions</h3>
    Encryption key (If set, the output will be encrypted):<br />
    <input type="password" id="output_encryption_key" value="" style="width: 40%" placeholder="Encryption Key" />
    <button id="update_output_encryption_key" scope="outputdata">Update</button>
    <br />
    <br />
    <div>
        <fieldset>
            <input
                type="radio"
                id="default_outputdata"
                name="sessions_select_outputdata"
                value="default"
                class="selects_session"
                scope="outputdata"
                checked
            />
            <label for="default_outputdata">Download</label>
            <br />
            <div class="sessions_radio_buttons" scope="outputdata"></div>
        </fieldset>
    </div>
</template>

<style scoped></style>