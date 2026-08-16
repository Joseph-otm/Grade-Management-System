// ============================================================
// STUDENT DASHBOARD
// ============================================================

let currentUser = null;
let currentProfile = null;


// ============================================================
// MODULES
// ============================================================

const MODULES = {

    hoeren: {
        name: "Hören",
        icon: "🎧",
        description: "Compréhension orale"
    },

    sprechen: {
        name: "Sprechen",
        icon: "🗣️",
        description: "Expression orale"
    },

    schreiben: {
        name: "Schreiben",
        icon: "✍️",
        description: "Expression écrite"
    },

    lesen: {
        name: "Lesen",
        icon: "📖",
        description: "Compréhension écrite"
    }

};


// ============================================================
// INITIALISATION
// ============================================================

async function initStudent() {

    console.log("🎓 Initialisation espace étudiant...");


    // ========================================================
    // VÉRIFIER LA CONNEXION
    // ========================================================

    const {
        data: {
            user
        },
        error: authError
    } = await supabaseClient.auth.getUser();


    if (authError || !user) {

        console.log(
            "❌ Aucun utilisateur connecté."
        );

        window.location.href =
            "index.html";

        return;
    }


    currentUser = user;


    console.log(
        "✅ Utilisateur connecté :",
        currentUser.id
    );


    // ========================================================
    // RÉCUPÉRER LE PROFIL
    // ========================================================

    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select(`
            id,
            full_name,
            role,
            teacher_note
        `)
        .eq(
            "id",
            currentUser.id
        )
        .single();


    if (profileError) {

        console.error(
            "❌ Erreur profil :",
            profileError
        );

        alert(
            "Impossible de charger votre profil."
        );

        return;
    }


    if (!profile) {

        console.error(
            "❌ Profil introuvable."
        );

        alert(
            "Profil étudiant introuvable."
        );

        return;
    }


    currentProfile =
        profile;


    console.log(
        "✅ Profil chargé :",
        profile
    );


    // ========================================================
    // VÉRIFIER LE RÔLE
    // ========================================================

    if (profile.role !== "student") {

        window.location.href =
            "teacher.html";

        return;
    }


    // ========================================================
    // AFFICHER LE NOM
    // ========================================================

    const studentName =
        document.getElementById(
            "student-name"
        );


    if (studentName) {

        studentName.textContent =
            `Bonjour ${profile.full_name} 👋`;

    }


    // ========================================================
    // AFFICHER LA NOTE DU PROFESSEUR
    // ========================================================

    displayTeacherNote(
        profile.teacher_note
    );


    // ========================================================
    // CHARGER LES NOTES
    // ========================================================

    await loadGrades();

}


// ============================================================
// NOTE DU PROFESSEUR
// ============================================================

function displayTeacherNote(
    teacherNote
) {

    const noteSection =
        document.getElementById(
            "teacher-note-section"
        );


    const noteText =
        document.getElementById(
            "teacher-note-text"
        );


    // --------------------------------------------------------
    // Vérification HTML
    // --------------------------------------------------------

    if (!noteSection) {

        console.error(
            "❌ #teacher-note-section introuvable dans student.html"
        );

        return;
    }


    if (!noteText) {

        console.error(
            "❌ #teacher-note-text introuvable dans student.html"
        );

        return;
    }


    // --------------------------------------------------------
    // Nettoyer la note
    // --------------------------------------------------------

    const note =
        teacherNote
            ? String(teacherNote).trim()
            : "";


    // --------------------------------------------------------
    // NOTE EXISTANTE
    // --------------------------------------------------------

    if (note !== "") {

        noteText.textContent =
            note;


        noteSection.style.display =
            "block";


        console.log(
            "📝 Note du professeur affichée :",
            note
        );

    }


    // --------------------------------------------------------
    // AUCUNE NOTE
    // --------------------------------------------------------

    else {

        noteText.textContent =
            "";


        noteSection.style.display =
            "none";


        console.log(
            "ℹ️ Aucune note du professeur."
        );

    }

}


// ============================================================
// CHARGER LES NOTES
// ============================================================

async function loadGrades() {

    const container =
        document.getElementById(
            "student-grades"
        );


    if (!container) {

        console.error(
            "❌ #student-grades introuvable."
        );

        return;
    }


    container.innerHTML = `
        <p>
            Chargement des résultats...
        </p>
    `;


    // ========================================================
    // RÉCUPÉRER LES NOTES
    // ========================================================

    const {
        data: grades,
        error
    } = await supabaseClient
        .from("grades")
        .select(`
            module,
            score,
            published
        `)
        .eq(
            "student_id",
            currentUser.id
        );


    // ========================================================
    // ERREUR
    // ========================================================

    if (error) {

        console.error(
            "❌ Erreur lors du chargement des notes :",
            error
        );


        container.innerHTML = `
            <p class="error-message">
                Impossible de charger les résultats.
            </p>
        `;

        return;
    }


    console.log(
        "📊 Toutes les notes :",
        grades
    );


    // ========================================================
    // NETTOYER
    // ========================================================

    container.innerHTML = "";


    // ========================================================
    // POUR CHAQUE MODULE
    // ========================================================

    Object.entries(
        MODULES
    ).forEach(
        ([moduleKey, moduleInfo]) => {


            // ------------------------------------------------
            // Chercher la note de ce module
            // ------------------------------------------------

            const grade =
                (grades || []).find(
                    item =>
                        item.module === moduleKey
                );


            // ------------------------------------------------
            // Créer la carte
            // ------------------------------------------------

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "student-grade-card";


            let scoreHTML;


            // =================================================
            // NOTE PUBLIÉE
            // =================================================

            if (
                grade &&
                grade.published === true &&
                grade.score !== null
            ) {

                const score =
                    Number(
                        grade.score
                    );


                scoreHTML = `
                    <div class="student-score published-score">

                        ${score.toFixed(2)}

                        <span>
                            /25
                        </span>

                    </div>
                `;

            }


            // =================================================
            // NOTE NON PUBLIÉE
            // =================================================

            else {

                scoreHTML = `
                    <div class="student-score pending-score">

                        <span>
                            En attente
                        </span>

                        <small>
                            ⏳
                        </small>

                    </div>
                `;

            }


            // =================================================
            // CONTENU CARTE
            // =================================================

            card.innerHTML = `

                <div class="student-grade-info">

                    <div class="student-module-icon">
                        ${moduleInfo.icon}
                    </div>


                    <div>

                        <h3>
                            ${moduleInfo.name}
                        </h3>

                        <p>
                            ${moduleInfo.description}
                        </p>

                    </div>

                </div>


                <div class="student-grade-result">

                    ${scoreHTML}

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );


    // ========================================================
    // RÉCUPÉRER LES 4 NOTES PUBLIÉES
    // ========================================================

    const publishedGrades =
        Object.keys(
            MODULES
        )
        .map(
            moduleKey =>
                (grades || []).find(
                    grade =>
                        grade.module === moduleKey &&
                        grade.published === true &&
                        grade.score !== null
                )
        )
        .filter(
            grade =>
                grade !== undefined
        );


    // ========================================================
    // VÉRIFIER SI LES 4 MODULES SONT PUBLIÉS
    // ========================================================

    const totalModules =
        Object.keys(
            MODULES
        ).length;


    const allModulesPublished =
        publishedGrades.length === totalModules;


    console.log(
        "📢 Nombre de modules publiés :",
        publishedGrades.length,
        "/",
        totalModules
    );


    // ========================================================
    // ELEMENTS TOTAL / RESULTAT
    // ========================================================

    const totalScoreElement =
        document.getElementById(
            "student-total-score"
        );


    const resultElement =
        document.getElementById(
            "student-result"
        );


    if (
        !totalScoreElement ||
        !resultElement
    ) {

        console.error(
            "❌ #student-total-score ou #student-result introuvable."
        );

        return;
    }


    // ========================================================
    // CAS 1
    // LES 4 NOTES NE SONT PAS PUBLIÉES
    // ========================================================

    if (!allModulesPublished) {

        totalScoreElement.textContent =
            "-- / 100";


        resultElement.textContent =
            "Notes en attente ⏳";


        resultElement.className =
            "student-result pending";


        console.log(
            "⏳ Résultat final encore en attente."
        );


        return;
    }


    // ========================================================
    // CAS 2
    // LES 4 NOTES SONT PUBLIÉES
    // ========================================================

    let total = 0;


    publishedGrades.forEach(
        grade => {

            total +=
                Number(
                    grade.score
                );

        }
    );


    // ========================================================
    // ARRONDIR
    // ========================================================

    total =
        Math.round(
            total * 100
        ) / 100;


    // ========================================================
    // AFFICHER TOTAL
    // ========================================================

    totalScoreElement.textContent =
        `${total.toFixed(2)} / 100`;


    // ========================================================
    // DÉTERMINER LE RÉSULTAT
    // ========================================================

    let resultText;


    if (total >= 90) {

        resultText =
            "Sehr gut ⭐";

    }

    else if (total >= 80) {

        resultText =
            "Gut 👍";

    }

    else if (total >= 70) {

        resultText =
            "Befriedigend";

    }

    else if (total >= 60) {

        resultText =
            "Ausreichend → ناجح ✅";

    }

    else {

        resultText =
            "Nicht bestanden ❌";

    }


    // ========================================================
    // AFFICHER LE RÉSULTAT
    // ========================================================

    resultElement.textContent =
        resultText;


    resultElement.className =
        "student-result";


    console.log(
        "🏆 Note générale :",
        total
    );


    console.log(
        "🏆 Résultat :",
        resultText
    );

}


// ============================================================
// LOGOUT
// ============================================================

const logoutButton =
    document.getElementById(
        "logout-btn"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            try {

                await supabaseClient.auth.signOut();

                window.location.href =
                    "index.html";

            }

            catch (error) {

                console.error(
                    "❌ Erreur lors de la déconnexion :",
                    error
                );

            }

        }
    );

}


// ============================================================
// START
// ============================================================

initStudent();