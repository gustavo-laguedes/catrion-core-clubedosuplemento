(function () {
  function assertClient() {
    if (!window.sb) {
      throw new Error("Supabase client não inicializado. window.sb está indefinido.");
    }
  }

  function dbToApp(row) {
    if (!row) return null;

    return {
      id: row.id,
      tenantId: row.tenant_id,
      levelKey: row.level_key,
      value: row.value ?? "",
      createdAt: row.created_at ?? null
    };
  }

  async function list(levelKey) {
    assertClient();

    return window.CatrionTenantContext.withTenant(async (tenantId) => {
      let query = window.sb
        .from("product_taxonomies")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("value", { ascending: true });

      if (levelKey) {
        query = query.eq("level_key", levelKey);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(dbToApp);
    });
  }

  async function create(levelKey, value) {
    assertClient();

    const cleanValue = String(value || "").trim();
    if (!cleanValue) throw new Error("Valor vazio.");

    return window.CatrionTenantContext.withTenant(async (tenantId) => {
      const payload = {
        tenant_id: tenantId,
        level_key: levelKey,
        value: cleanValue
      };

      const { data, error } = await window.sb
        .from("product_taxonomies")
        .insert([payload])
        .select("*")
        .single();

      if (error) throw error;
      return dbToApp(data);
    });
  }

  async function remove(levelKey, value) {
    assertClient();

    const cleanValue = String(value || "").trim();
    if (!cleanValue) throw new Error("Valor vazio.");

    return window.CatrionTenantContext.withTenant(async (tenantId) => {
      const { error } = await window.sb
        .from("product_taxonomies")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("level_key", levelKey)
        .eq("value", cleanValue);

      if (error) throw error;
      return true;
    });
  }

  window.ProductTaxonomiesStore = {
    list,
    create,
    remove
  };
})();