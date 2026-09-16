import { Music4 } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Moldura das telas de autenticação.
 *
 * Fora do AppLayout de propósito: quem não entrou não deve ver sidebar,
 * busca global nem notificações — elementos que só fazem sentido com sessão.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Music4 className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {children}

        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  );
}
