import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/store/authStore";
import { useCompoze } from "@/store/compozeStore";

/**
 * Impede o acesso às telas do app sem sessão, e carrega os dados ao entrar.
 *
 * Não substitui a autorização do servidor: o backend verifica cada requisição
 * (PRD §26). Isto é conveniência de navegação — evita telas vazias e
 * requisições que só voltariam 401.
 */
export function RequireAuth() {
  const { user, carregando, restaurarSessao } = useAuth();
  const hidratado = useCompoze((s) => s.hidratado);
  const hydrate = useCompoze((s) => s.hydrate);
  const location = useLocation();

  useEffect(() => {
    // Só tenta restaurar uma vez, na abertura. O `carregando` inicial é true,
    // então esta é a primeira coisa que acontece antes de decidir redirecionar.
    if (carregando) void restaurarSessao();
  }, [carregando, restaurarSessao]);

  useEffect(() => {
    // Carrega músicas, pastas e projetos assim que houver sessão. Fica aqui, e
    // não no login, para cobrir também quem chega com sessão restaurada.
    if (user && !hidratado) void hydrate(user.id);
  }, [user, hidratado, hydrate]);

  // Enquanto não se sabe, não redireciona: chutar para o login aqui faria quem
  // recarrega a página passar pela tela de entrada antes da sessão voltar.
  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="sr-only">Verificando sessão</span>
      </div>
    );
  }

  if (!user) {
    // Guarda o destino para voltar a ele depois do login.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
