// shared/supabaseClient.js
(function () {
  if (!window.ENV) {
    console.error("ENV não carregou. Garanta que shared/env.js vem antes.");
    return;
  }

  if (!window.supabase || !window.supabase.createClient) {
    console.error("Supabase lib não carregou. Verifique o script CDN antes do supabaseClient.js");
    return;
  }

  const url = window.ENV.SUPABASE_URL;
  const anon = window.ENV.SUPABASE_ANON_KEY;

  window.sb = window.supabase.createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "catrion_sb_auth"
    }
  });

  // Log básico de eventos de auth
  window.sb.auth.onAuthStateChange((event, session) => {
    const uid = session?.user?.id || null;
    console.log("🔐 Auth event:", event, "uid:", uid);

    if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && uid) {
      setTimeout(() => {
        if (typeof window.CoreUpdateAvatar === "function") {
          window.CoreUpdateAvatar(uid);
        }
      }, 300);
    }
  });

  console.log("✅ Supabase client criado (window.sb):", window.sb);
})();