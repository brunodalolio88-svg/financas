// Atualizando conexao com o banco
// functions/api/financas.js
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    // GET: Buscar todas as transações
    if (request.method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT * FROM transacoes ORDER BY data DESC"
      ).all();
      return Response.json(results);
    }

    // POST: Adicionar nova transação
    if (request.method === "POST") {
      const data = await request.json();
      await env.DB.prepare(
        "INSERT INTO transacoes (tipo, descricao, categoria, valor, status, data) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(data.tipo, data.descricao, data.categoria, data.valor, data.status, new Date().toISOString()).run();
      return Response.json({ success: true });
    }

    // DELETE: Remover transação
    if (request.method === "DELETE") {
      const id = url.searchParams.get("id");
      await env.DB.prepare("DELETE FROM transacoes WHERE id = ?").bind(id).run();
      return Response.json({ success: true });
    }

    // PUT: Atualizar Status (Alternar entre Pago/Pendente)
    if (request.method === "PUT") {
      const data = await request.json();
      // Se enviarmos apenas o ID e o novo status
      await env.DB.prepare(
        "UPDATE transacoes SET status = ? WHERE id = ?"
      ).bind(data.status, data.id).run();
      return Response.json({ success: true });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
