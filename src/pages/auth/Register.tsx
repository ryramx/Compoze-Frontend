import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/store/authStore";
import { AuthLayout } from "./AuthLayout";

// Mesma regra do backend (schemas/auth.py): username entra na URL do perfil.
const USERNAME_VALIDO = /^[a-zA-Z0-9_.-]+$/;
const SENHA_MINIMA = 8;

export default function Register() {
  const cadastrar = useAuth((s) => s.register);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Validação local antes de enviar: o backend valida de novo — ele é a
  // autoridade —, mas dizer o problema na hora evita uma ida ao servidor para
  // descobrir que a senha é curta.
  function validar(): string | null {
    if (name.trim().length === 0) return "Informe seu nome.";
    if (username.length < 3) return "O nome de usuário precisa ter ao menos 3 caracteres.";
    if (!USERNAME_VALIDO.test(username))
      return "O nome de usuário aceita apenas letras, números, ponto, hífen e sublinhado.";
    if (password.length < SENHA_MINIMA)
      return `A senha precisa ter ao menos ${SENHA_MINIMA} caracteres.`;
    return null;
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const problema = validar();
    if (problema) {
      setErro(problema);
      return;
    }

    setErro(null);
    setEnviando(true);
    try {
      await cadastrar({ name, username, email, password });
      navigate("/", { replace: true });
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
      title="Criar conta"
      subtitle="Um lugar só para suas ideias, letras e projetos."
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como você assina suas obras"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Nome de usuário</Label>
          <Input
            id="username"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="seu.usuario"
          />
          <p className="text-xs text-muted-foreground">
            Aparece no endereço do seu perfil público.
          </p>
        </div>

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
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Ao menos {SENHA_MINIMA} caracteres.
          </p>
        </div>

        {erro && (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={enviando}>
          {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
          Criar conta
        </Button>
      </form>
    </AuthLayout>
  );
}
