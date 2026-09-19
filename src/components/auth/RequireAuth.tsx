import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/authStore";
import { useCompoze } from "@/store/compozeStore";

function TelaDeEspera({ mensagem }: { mensagem: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{mensagem}</span>
    </div>
  );
}

/**
 * Impede o acesso às telas do app sem sessão, e garante que os dados já
 * estejam carregados antes de renderizá-las.
 *
 * Não substitui a autorização do servidor: o backend verifica cada requisição
 * (PRD §26). Isto é conveniência de navegação — evita telas vazias e
 * requisições que só voltariam 401.
 */
export function RequireAuth() {
  const { user, carregando, restaurarSessao } = useAuth();
  const hidratado = useCompoze((s) => s.hidratado);
  const carregandoDados = useCompoze((s) => s.carregando);
  const erroDados = useCompoze((s) => s.erro);
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
    if (user && !hidratado && !carregandoDados && !erroDados) void hydrate(user.id);
  }, [user, hidratado, carregandoDados, erroDados, hydrate]);

  // Enquanto não se sabe se há sessão, não redireciona: chutar para o login
  // aqui faria quem recarrega a página passar pela tela de entrada antes da
  // sessão voltar.
  if (carregando) return <TelaDeEspera mensagem="Verificando sessão" />;

  if (!user) {
    // Guarda o destino para voltar a ele depois do login.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (erroDados) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <WifiOff className="h-6 w-6 text-muted-foreground" />
        <p className="max-w-sm text-sm text-muted-foreground">{erroDados}</p>
        <Button variant="outline" onClick={() => void hydrate(user.id)}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Espera a carga terminar antes de renderizar qualquer tela. Sem isto, as
  // páginas que assumem o usuário já carregado (`users.find(...)!` no Dashboard,
  // no editor e no perfil) recebem `undefined` e quebram a renderização inteira
  // — tela em branco, que foi exatamente o que aconteceu no primeiro cadastro.
  if (!hidratado) return <TelaDeEspera mensagem="Carregando suas composições" />;

  return <Outlet />;
}
