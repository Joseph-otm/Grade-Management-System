// ============================================================
// TEACHER DASHBOARD
// ============================================================

let currentUser = null;
let currentProfile = null;

let selectedModule = null;
let selectedStudent = null;
let selectedGrade = null;


// ============================================================
// MODULES
// ============================================================

const MODULES = {

    lesen: {
        name: "Lesen",
        icon: "📖",
        description: "Compréhension écrite"
    },

    schreiben: {
        name: "Schreiben",
        icon: "✍️",
        description: "Expression écrite"
    },

    hoeren: {
        name: "Hören",
        icon: "🎧",
        description: "Compréhension orale"
    },

    sprechen: {
        name: "Sprechen",
        icon: "🗣️",
        description: "Expression orale"
    }

};


// ============================================================
// INITIALISATION
// ============================================================

async function initTeacher() {

    const {
        data: {
            user
        },
        error
    } = await supabaseClient.auth.getUser();


    if (error || !user) {

        window.location.href = "index.html";

        return;
    }


    currentUser = user;


    // Récupérer le profil

    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user.id)
        .single();


    if (profileError || !profile) {

        console.error(profileError);

        alert("Profil professeur introuvable.");

        return;
    }


    if (profile.role !== "teacher") {

        window.location.href = "student.html";

        return;
    }


    currentProfile = profile;


    document.getElementById(
        "teacher-name"
    ).textContent =
        `Bonjour ${profile.full_name} 👋`;

}


// ============================================================
// BOUTONS MODULES
// ============================================================

document
    .querySelectorAll(".manage-module-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const module =
                    this.dataset.module;

                openModule(module);

            }
        );

    });


// ============================================================
// OUVRIR UN MODULE
// ============================================================

async function openModule(module) {

    if (!MODULES[module]) {

        return;
    }


    selectedModule = module;


    const moduleInfo =
        MODULES[module];


    document.getElementById(
        "modules-section"
    ).style.display = "none";


    document.getElementById(
        "student-details-section"
    ).style.display = "none";


    document.getElementById(
        "students-section"
    ).style.display = "block";


    document.getElementById(
        "selected-module-title"
    ).textContent =
        `${moduleInfo.icon} ${moduleInfo.name} — /25`;


    await loadStudents();

}


// ============================================================
// CHARGER LES ÉTUDIANTS
// ============================================================

async function loadStudents() {

    const container =
        document.getElementById(
            "students-list"
        );


    container.innerHTML =
        "<p>Chargement des étudiants...</p>";


    const {
        data: students,
        error
    } = await supabaseClient
        .from("profiles")
        .select("id, full_name, teacher_note")
        .eq("role", "student")
        .order("full_name", {
            ascending: true
        });


    if (error) {

        console.error(error);

        container.innerHTML =
            `<p>Erreur : ${error.message}</p>`;

        return;
    }


    if (!students || students.length === 0) {

        container.innerHTML =
            "<p>Aucun étudiant trouvé.</p>";

        return;
    }


    // Récupérer les notes du module

    const {
        data: grades,
        error: gradesError
    } = await supabaseClient
        .from("grades")
        .select(
            "id, student_id, score, published"
        )
        .eq("module", selectedModule);


    if (gradesError) {

        console.error(gradesError);

        container.innerHTML =
            `<p>Erreur : ${gradesError.message}</p>`;

        return;
    }


    container.innerHTML = "";


    students.forEach(student => {

        const grade =
            grades?.find(
                item =>
                    item.student_id === student.id
            );


        const card =
            document.createElement("div");


        card.className =
            "student-card";


        let scoreText =
            "Note non saisie";


        if (
            grade &&
            grade.score !== null
        ) {

            scoreText =
                `${grade.score} / 25`;

        }


        card.innerHTML = `

            <div class="student-card-left">

                <div class="student-avatar-small">
                    👨‍🎓
                </div>

                <div>

                    <strong>
                        ${escapeHtml(
                            student.full_name
                        )}
                    </strong>

                    <small>
                        ${scoreText}
                    </small>

                </div>

            </div>


            <div class="student-card-right">

                ${
                    grade?.published
                        ? `
                            <span class="published-mini">
                                🟢 Publié
                            </span>
                          `
                        : ""
                }


                <button
                    class="student-open-button"
                >
                    Voir les notes →
                </button>

            </div>

        `;


        card
            .querySelector(
                ".student-open-button"
            )
            .addEventListener(
                "click",
                () => openStudent(student.id)
            );


        container.appendChild(card);

    });

}


// ============================================================
// OUVRIR UN ÉTUDIANT
// ============================================================

async function openStudent(studentId) {

    selectedStudent = null;
    selectedGrade = null;


    // ============================================================
    // RÉCUPÉRER L'ÉTUDIANT
    // ============================================================

    const {
        data: student,
        error: studentError
    } = await supabaseClient
        .from("profiles")
        .select("id, full_name, teacher_note")
        .eq("id", studentId)
        .single();


    if (studentError || !student) {

        console.error(studentError);

        alert("Étudiant introuvable.");

        return;
    }


    selectedStudent = student;


    // ============================================================
    // RÉCUPÉRER LA NOTE DU MODULE
    // ============================================================

    const {
        data: grade,
        error: gradeError
    } = await supabaseClient
        .from("grades")
        .select(`
            id,
            student_id,
            module,
            score,
            published
        `)
        .eq("student_id", studentId)
        .eq("module", selectedModule)
        .maybeSingle();


    if (gradeError) {

        console.error(gradeError);

        alert(
            "Erreur lors du chargement de la note."
        );

        return;
    }


    selectedGrade = grade;


    // ============================================================
    // AFFICHER LA PAGE
    // ============================================================

    document.getElementById(
        "students-section"
    ).style.display = "none";


    document.getElementById(
        "student-details-section"
    ).style.display = "block";


    // ============================================================
    // INFORMATIONS MODULE
    // ============================================================

    const info =
        MODULES[selectedModule];


    document.getElementById(
        "selected-student-name"
    ).textContent =
        student.full_name;


    document.getElementById(
        "selected-module-name"
    ).textContent =
        `${info.icon} ${info.name}`;


    document.getElementById(
        "grade-module-description"
    ).textContent =
        info.description;


    // ============================================================
    // NOTE
    // ============================================================

    document.getElementById(
        "module-grade-input"
    ).value =
        grade?.score ?? "";


    // ============================================================
    // NOTE DU PROFESSEUR
    // ============================================================

    const teacherNoteInput =
        document.getElementById(
            "teacher-note-input"
        );


    if (teacherNoteInput) {

        teacherNoteInput.value =
            student.teacher_note || "";

    }


    // ============================================================
    // STATUT
    // ============================================================

    updatePublicationStatus();

    updateButtons();

}


// ============================================================
// STATUT PUBLICATION
// ============================================================

function updatePublicationStatus() {

    const status =
        document.getElementById(
            "publication-status"
        );


    if (
        selectedGrade &&
        selectedGrade.published
    ) {

        status.textContent =
            "🟢 Publié";

        status.className =
            "publication-status published";

    } else {

        status.textContent =
            "⚪ Non publié";

        status.className =
            "publication-status";

    }

}


// ============================================================
// BOUTONS
// ============================================================

function updateButtons() {

    const saveButton =
        document.getElementById(
            "save-grade-btn"
        );

    const publishButton =
        document.getElementById(
            "publish-grade-btn"
        );

    const editButton =
        document.getElementById(
            "edit-grade-btn"
        );


    if (
        selectedGrade &&
        selectedGrade.published
    ) {

        saveButton.style.display =
            "none";

        publishButton.style.display =
            "none";

        editButton.style.display =
            "inline-flex";

        document.getElementById(
            "module-grade-input"
        ).disabled = true;

    } else {

        saveButton.style.display =
            "inline-flex";

        publishButton.style.display =
            "inline-flex";

        editButton.style.display =
            "none";

        document.getElementById(
            "module-grade-input"
        ).disabled = false;

    }

}


// ============================================================
// MODIFIER
// ============================================================

document
    .getElementById(
        "edit-grade-btn"
    )
    .addEventListener(
        "click",
        function () {

            document.getElementById(
                "module-grade-input"
            ).disabled = false;


            document.getElementById(
                "save-grade-btn"
            ).style.display =
                "inline-flex";


            document.getElementById(
                "publish-grade-btn"
            ).style.display =
                "inline-flex";


            this.style.display =
                "none";


            showMessage(
                "Vous pouvez modifier la note ✏️",
                "info"
            );

        }
    );


// ============================================================
// ENREGISTRER
// ============================================================

document
    .getElementById(
        "save-grade-btn"
    )
    .addEventListener(
        "click",
        saveGrade
    );


async function saveGrade() {

    if (
        !selectedStudent ||
        !selectedModule
    ) {

        return;
    }


    const input =
        document.getElementById(
            "module-grade-input"
        );


    const value =
        input.value.trim();


    if (value === "") {

        showMessage(
            "Veuillez saisir une note.",
            "error"
        );

        return;
    }


    const score =
        Number(value);


    if (
        Number.isNaN(score) ||
        score < 0 ||
        score > 25
    ) {

        showMessage(
            "La note doit être comprise entre 0 et 25.",
            "error"
        );

        return;
    }


    let response;


    if (selectedGrade) {

        // UPDATE

        response =
            await supabaseClient
                .from("grades")
                .update({

                    score: score,

                    updated_at:
                        new Date().toISOString()

                })
                .eq(
                    "id",
                    selectedGrade.id
                );

    } else {

        // INSERT

        response =
            await supabaseClient
                .from("grades")
                .insert({

                    student_id:
                        selectedStudent.id,

                    module:
                        selectedModule,

                    score:
                        score,

                    published:
                        false

                });

    }


    if (response.error) {

        console.error(
            response.error
        );

        showMessage(
            "Erreur : " +
            response.error.message,
            "error"
        );

        return;
    }


    // Recharger

    const {
        data: newGrade
    } = await supabaseClient
        .from("grades")
        .select(`
            id,
            student_id,
            module,
            score,
            published
        `)
        .eq(
            "student_id",
            selectedStudent.id
        )
        .eq(
            "module",
            selectedModule
        )
        .single();


    selectedGrade =
        newGrade;


    updatePublicationStatus();


    updateButtons();


    showMessage(
        "Note enregistrée avec succès ✅",
        "success"
    );

}


// ============================================================
// PUBLIER
// ============================================================

document
    .getElementById(
        "publish-grade-btn"
    )
    .addEventListener(
        "click",
        publishGrade
    );


async function publishGrade() {

    if (!selectedGrade) {

        showMessage(
            "Veuillez d'abord enregistrer la note.",
            "error"
        );

        return;
    }


    const score =
        Number(
            document.getElementById(
                "module-grade-input"
            ).value
        );


    if (
        Number.isNaN(score) ||
        score < 0 ||
        score > 25
    ) {

        showMessage(
            "Note invalide.",
            "error"
        );

        return;
    }


    const confirmed =
        confirm(
            `Publier la note de ${selectedStudent.full_name} ?`
        );


    if (!confirmed) {

        return;
    }


    const {
        error
    } = await supabaseClient
        .from("grades")
        .update({

            score: score,

            published: true,

            updated_at:
                new Date().toISOString()

        })
        .eq(
            "id",
            selectedGrade.id
        );


    if (error) {

        console.error(error);

        showMessage(
            "Erreur : " + error.message,
            "error"
        );

        return;
    }


    selectedGrade.score =
        score;

    selectedGrade.published =
        true;


    updatePublicationStatus();

    updateButtons();


    showMessage(
        "Note publiée avec succès 📢",
        "success"
    );

}


// ============================================================
// RETOUR AUX ÉTUDIANTS
// ============================================================

document
    .getElementById(
        "back-to-students-btn"
    )
    .addEventListener(
        "click",
        function () {

            document.getElementById(
                "student-details-section"
            ).style.display = "none";


            document.getElementById(
                "students-section"
            ).style.display = "block";


            selectedStudent = null;
            selectedGrade = null;


            loadStudents();

        });


// ============================================================
// RETOUR AUX MODULES
// ============================================================

document
    .getElementById(
        "back-to-modules-btn"
    )
    .addEventListener(
        "click",
        function () {

            document.getElementById(
                "students-section"
            ).style.display = "none";


            document.getElementById(
                "student-details-section"
            ).style.display = "none";


            document.getElementById(
                "modules-section"
            ).style.display = "block";


            selectedModule = null;
            selectedStudent = null;
            selectedGrade = null;

        });


// ============================================================
// MESSAGE
// ============================================================

function showMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "grade-message"
        );


    element.textContent =
        message;


    element.className =
        `result-message ${type}`;


    setTimeout(
        () => {

            element.textContent = "";

        },
        5000
    );

}


// ============================================================
// SECURITY HTML
// ============================================================

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text ?? "";

    return div.innerHTML;

}


// ============================================================
// LOGOUT
// ============================================================

document
    .getElementById(
        "logout-btn"
    )
    .addEventListener(
        "click",
        async function () {

            await supabaseClient.auth.signOut();

            window.location.href =
                "index.html";

        });

        document
    .getElementById("save-note-btn")
    .addEventListener(
        "click",
        saveTeacherNote
    );


async function saveTeacherNote() {

    if (!selectedStudent) {

        return;
    }


    const note =
        document
            .getElementById(
                "teacher-note-input"
            )
            .value
            .trim();


    const {
        error
    } = await supabaseClient
        .from("profiles")
        .update({

            teacher_note:
                note

        })
        .eq(
            "id",
            selectedStudent.id
        );


    if (error) {

        console.error(error);

        document.getElementById(
            "note-message"
        ).textContent =
            "Erreur : " + error.message;

        return;
    }


    selectedStudent.teacher_note =
        note;


    document.getElementById(
        "note-message"
    ).textContent =
        "Note enregistrée avec succès ✅";


    setTimeout(() => {

        document.getElementById(
            "note-message"
        ).textContent = "";

    }, 4000);

}


// ============================================================
// START
// ============================================================

initTeacher();