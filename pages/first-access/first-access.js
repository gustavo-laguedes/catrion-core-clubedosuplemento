(function () {
  const emailInput = document.getElementById("faEmail");
  const fullNameInput = document.getElementById("faFullName");
  const passwordInput = document.getElementById("faPassword");
  const passwordConfirmInput = document.getElementById("faPasswordConfirm");
  const avatarFileInput = document.getElementById("faAvatarFile");
  const avatarPickBtn = document.getElementById("faAvatarPick");
  const avatarPreview = document.getElementById("faAvatarPreview");
  const saveBtn = document.getElementById("faSave");
  const feedback = document.getElementById("faFeedback");

  let uploadedAvatarPath = null;

  function setFeedback(message = "", type = "") {
    if (!message) {
      feedback.textContent = "";
      feedback.className = "hidden";
      return;
    }

    feedback.textContent = message;
    feedback.className = "";
    feedback.classList.add(type === "success" ? "fa-feedback-success" : "fa-feedback-error");
  }

  function getEmailFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("email") || "";
  }

  async function uploadAvatar(file) {
    const { data: sessionData } = await window.sb.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      throw new Error("Sessão inválida para upload da foto.");
    }

    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${userId}/avatar.${ext}`;

    const { error } = await window.sb.storage
      .from("user-avatars")
      .upload(path, file, {
        upsert: true
      });

    if (error) throw error;

    uploadedAvatarPath = path;
    return path;
  }

  avatarPickBtn?.addEventListener("click", () => {
    avatarFileInput.click();
  });

  avatarFileInput?.addEventListener("change", async () => {
    const file = avatarFileInput.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    avatarPreview.innerHTML = `<img src="${localUrl}" alt="Avatar">`;

    try {
      await uploadAvatar(file);
    } catch (err) {
      console.error(err);
      setFeedback("Não foi possível enviar a foto agora.", "error");
    }
  });

  async function saveFirstAccess() {
    const email = String(emailInput.value || "").trim();
    const fullName = String(fullNameInput.value || "").trim();
    const password = String(passwordInput.value || "");
    const confirm = String(passwordConfirmInput.value || "");

    setFeedback("");

    if (!fullName) {
      setFeedback("Preencha seu nome completo.", "error");
      return;
    }

    if (!password || password.length < 6) {
      setFeedback("A senha deve ter pelo menos 6 caracteres.", "error");
      return;
    }

    if (password !== confirm) {
      setFeedback("A confirmação de senha não confere.", "error");
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Salvando...";

    try {
      const { error: updateAuthError } = await window.sb.auth.updateUser({
        password,
        data: {
          full_name: fullName,
          role: "OPER"
        }
      });

      if (updateAuthError) throw updateAuthError;

      const { data: sessionData } = await window.sb.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (!userId) {
        throw new Error("Usuário não encontrado para concluir o primeiro acesso.");
      }

      const { error: profileError } = await window.sb
        .from("profiles")
        .update({
          email,
          full_name: fullName,
          avatar_path: uploadedAvatarPath,
          first_access_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      setFeedback("Cadastro concluído com sucesso. Redirecionando...", "success");

      setTimeout(() => {
        window.location.href = "/index.html";
      }, 1200);
    } catch (err) {
      console.error(err);
      setFeedback(err.message || "Não foi possível concluir o primeiro acesso.", "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Salvar e continuar";
    }
  }

  saveBtn?.addEventListener("click", saveFirstAccess);

  emailInput.value = getEmailFromUrl();
})();