import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Settings as SettingsIcon } from "lucide-react";
import { useCompoze } from "@/store/compozeStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Estritamente os campos que já existem no modelo User (name, bio,
// instagram) — não é uma central de configurações. username, avatar,
// location e tema não ganham UI de edição aqui: username/location não têm
// suporte de validação/geocoding no modelo atual, avatar precisaria de
// upload (fora de escopo), e tema já tem seu próprio ThemeToggle na topbar.
const schema = z.object({
  name: z.string().trim().min(1, "Informe um nome"),
  bio: z.string().trim().max(280, "Máximo de 280 caracteres").optional(),
  instagram: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Settings() {
  const me = useCompoze((s) => s.users.find((u) => u.id === s.currentUserId)!);
  const updateCurrentUser = useCompoze((s) => s.updateCurrentUser);
  const [saved, setSaved] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: me.name, bio: me.bio, instagram: me.instagram ?? "" },
  });

  const onSubmit = (values: FormValues) => {
    updateCurrentUser({
      name: values.name.trim(),
      bio: values.bio?.trim() ?? "",
      instagram: values.instagram?.trim() || undefined,
    });
    toast.success("Perfil atualizado");
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
          <SettingsIcon className="h-6 w-6 text-primary" /> Configurações
        </h1>
        <p className="text-sm text-muted-foreground">Edite as informações do seu perfil.</p>
      </div>

      <Card className="border-border/60 bg-gradient-card p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biografia</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <Input placeholder="seu.usuario" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saved ? "Salvo ✓" : "Salvar alterações"}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
