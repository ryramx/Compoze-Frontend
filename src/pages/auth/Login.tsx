import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/store/authStore";
import { AuthLayout } from "./AuthLayout";

export default function Login() {
  const entrar = useAuth((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Para onde a pessoa ia antes de ser mandada ao login. Devolvê-la ao destino
  // original evita que um link compartilhado sempre termine no Dashboard.
  const destino = (location.state as { from?: string } | null)?.from ?? "/";

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await entrar(email, senha);
      navigate(destino, { replace: true });
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status !== 0
          ? err.message
          : "Não foi possível conectar ao servidor. Verifique se a API está no ar.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout
      title="Entrar no Compoze"
      subtitle="Suas composições, do jeito que você deixou."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="font-medium text-primary hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="senha">Senha</Label>
          <Input
            id="senha"
            type="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        {erro && (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={enviando}>
          {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
          Entrar
        </Button>
      </form>
    </AuthLayout>
  );
}
