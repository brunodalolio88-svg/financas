export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { usuario, senha } = await request.json();

    // Busca o usuário no banco
    const user = await env.DB.prepare(
      "SELECT * FROM usuarios WHERE usuario = ? AND senha = ?"
    ).bind(usuario, senha).first();

    if (!user) {
      return new Response(JSON.stringify({ success: false, message: "Usuário ou senha incorretos" }), { status: 401 });
    }

    // Retorna sucesso e o nome para mostrar na tela
    return new Response(JSON.stringify({ 
      success: true, 
      nome: user.nome,
      id: user.id 
    }), { headers: { "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
