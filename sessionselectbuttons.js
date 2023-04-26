$(document).ready(async () => {
    let sessionsMeta = await recreateSessionsMeta();

    $(".sessions_radio_buttons").each(async function () {
        session_names_div = $(this);
        let scope = session_names_div.attr("scope") ?? "page";

        Object.values(sessionsMeta).forEach((sessionMeta) => {
            session_names_div.append(`
                <input type="radio" id="${sessionMeta.name}_${scope}" name="sessions_select_${scope}" value="${sessionMeta.name}" class="selects_session" scope="page" />
                <label for="${sessionMeta.name}_${scope}">${sessionMeta.name}</label>
                <br />
                `);
        });
        $(".selects_session").on("click", function () {
            let klicked_scope = $(this).attr("scope") ?? "page";
            let res = selectSession($(this).attr("value"), klicked_scope);

            if (!res && $(this).attr("value") != "default") {
                selectSession("default", klicked_scope);
            }

            $("#load_files_from_session").click(); // trigger display loading if this hidden button is present on the page
        });
    });
});
