const loginForm = document.getElementById("login-form");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "Connexion...";

    // Connexion avec Supabase Auth
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        console.error("SUPABASE ERROR:", error);
        message.textContent = error.message;
        return;
    }

    const user = data.user;

    console.log("Utilisateur connecté :", user);

    // Récupérer le profil de l'utilisateur
    const { data: profile, error: profileError } =
        await supabaseClient
            .from("profiles")
            .select("full_name, role")
            .eq("id", user.id)
            .single();

    if (profileError) {
        console.error("PROFILE ERROR:", profileError);

        message.textContent =
            "Utilisateur connecté, mais profil introuvable.";

        return;
    }

    console.log("Profil :", profile);

    message.textContent = "Connexion réussie !";

    // Redirection selon le rôle
    setTimeout(() => {

        if (profile.role === "teacher") {
            window.location.href = "teacher.html";
        }

        else if (profile.role === "student") {
            window.location.href = "student.html";
        }

        else {
            message.textContent = "Rôle utilisateur inconnu.";
        }

    }, 500);
});