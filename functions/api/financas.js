export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    // --- ROTAS DE CONFIGURAÇÃO (MEMÓRIA DO MÊS) ---
    
    // Ler onde parou
    if (request.method === "GET" && url.searchParams.get("tipo") === "config") {
      const config = await env.DB.prepare("SELECT ultimo_mes FROM configuracoes WHERE id = 'padrao'").first();
      // Se não tiver nada salvo, ou se o mês virou e não tem config futura, a lógica do front decide.
      // Aqui retornamos o que está no banco.
      return Response.json(config || { ultimo_mes: null });
    }

    // Salvar onde parou
    if (request.method === "POST" && url.searchParams.get("tipo") === "config") {
      const data = await request.json();
      await env.DB.prepare("UPDATE configuracoes SET ultimo_mes = ? WHERE id = 'padrao'").bind(data.ultimo_mes).run();
      return Response.json({ success: true });
    }

    // --- ROTAS DE FINANÇAS (IGUAIS AS DE ANTES) ---

    if (request.method === "GET") {
      const mesFiltro = url.searchParams.get("mes"); 
      let query = "SELECT * FROM transacoes";
      let params = [];

      if (mesFiltro) {
        query += " WHERE strftime('%Y-%m', data) = ? ORDER BY data DESC";
        params.push(mesFiltro);
      } else {
        query += " ORDER BY data DESC LIMIT 100";
      }

      const { results } = await env.DB.prepare(query).bind(...params).all();
      return Response.json(results);
    }

    if (request.method === "POST") {
      const data = await request.json();
      const dataRegistro = data.data || new Date().toISOString();
      await env.DB.prepare(
        "INSERT INTO transacoes (tipo, descricao, categoria, valor, status, data) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(data.tipo, data.descricao, data.categoria, data.valor, data.status, dataRegistro).run();
      return Response.json({ success: true });
    }

    if (request.method === "DELETE") {
      const id = url.searchParams.get("id");
      await env.DB.prepare("DELETE FROM transacoes WHERE id = ?").bind(id).run();
      return Response.json({ success: true });
    }

    if (request.method === "PUT") {
      const data = await request.json();
      const atual = await env.DB.prepare("SELECT * FROM transacoes WHERE id = ?").bind(data.id).first();
      if (!atual) return new Response("Item não encontrado", { status: 404 });

      const novoStatus = data.status || atual.status;
      const novaDescricao = data.descricao || atual.descricao;
      const novoValor = (data.valor !== undefined && data.valor !== "") ? data.valor : atual.valor;
      const novaCategoria = data.categoria || atual.categoria;

      await env.DB.prepare(
        "UPDATE transacoes SET descricao = ?, valor = ?, status = ?, categoria = ? WHERE id = ?"
      ).bind(novaDescricao, novoValor, novoStatus, novaCategoria, data.id).run();
      return Response.json({ success: true });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
