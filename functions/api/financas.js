export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    // GET: Agora aceita filtro por Mês (Formato YYYY-MM)
    if (request.method === "GET") {
      const mesFiltro = url.searchParams.get("mes"); // Ex: '2026-01'
      
      let query = "SELECT * FROM transacoes";
      let params = [];

      // Se o front mandar um mês, filtramos. Se não, pega tudo (segurança)
      if (mesFiltro) {
        // SQLite usa strftime para pegar pedaços da data. %Y-%m extrai '2026-01'
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
      // Salvamos a data exata que o usuário escolheu ou a atual
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

      await env.DB.prepare(
        "UPDATE transacoes SET descricao = ?, valor = ?, status = ? WHERE id = ?"
      ).bind(novaDescricao, novoValor, novoStatus, data.id).run();
      
      return Response.json({ success: true });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
