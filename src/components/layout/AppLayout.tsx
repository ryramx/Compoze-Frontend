import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Sparkles } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/compoze/ThemeToggle";
import { MobileNav } from "./MobileNav";
import { useCompoze } from "@/store/compozeStore";
import { UserAvatar } from "@/components/compoze/UserAvatar";
import { Link } from "react-router-dom";
import { GlobalSearch } from "@/components/compoze/GlobalSearch";
import { NotificationsPopover } from "@/components/compoze/NotificationsPopover";
import { AppBreadcrumb, type BreadcrumbEntry } from "./AppBreadcrumb";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/songs": "Canções",
  "/folders": "Pastas",
  "/projects": "Projetos",
  "/feed": "Feed",
  "/messages": "Mensagens",
  "/map": "Mapa de compositores",
  "/profile": "Perfil",
  "/trash": "Lixeira",
  "/settings": "Configurações",
};

// Breadcrumb dinâmico só nas páginas onde ele agrega contexto real
// (registro hierárquico: canção dentro de "Canções", projeto dentro de
// "Projetos"). Páginas de nível único continuam usando o título estático.
const songEditMatch = /^\/songs\/([^/]+)\/edit$/;
const projectDetailMatch = /^\/projects\/([^/]+)$/;

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const baseKey = "/" + (location.pathname.split("/")[1] || "");
  const title =
    titles[location.pathname] || titles[baseKey] || "Compoze";
  const me = useCompoze((s) => s.users.find((u) => u.id === s.currentUserId));
  const createSong = useCompoze((s) => s.createSong);
  const canGoBack = location.pathname !== "/";

  const songId = location.pathname.match(songEditMatch)?.[1];
  const projectId = location.pathname.match(projectDetailMatch)?.[1];
  const editingSong = useCompoze((s) => (songId ? s.getSong(songId) : undefined));
  const viewingProject = useCompoze((s) => (projectId ? s.getProject(projectId) : undefined));

  let breadcrumbItems: BreadcrumbEntry[] | null = null;
  if (songId) {
    breadcrumbItems = [
      { label: "Home", to: "/" },
      { label: "Canções", to: "/songs" },
      { label: editingSong?.title ?? "Canção" },
    ];
  } else if (projectId) {
    breadcrumbItems = [
      { label: "Home", to: "/" },
      { label: "Projetos", to: "/projects" },
      { label: viewingProject?.name ?? "Projeto" },
    ];
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/75 px-4 backdrop-blur-xl md:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            {canGoBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                aria-label="Voltar"
                className="rounded-full text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="hidden min-w-0 md:flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Compoze
              </span>
              {breadcrumbItems ? (
                <AppBreadcrumb items={breadcrumbItems} />
              ) : (
                <h1 className="font-display text-lg font-semibold leading-tight">{title}</h1>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <GlobalSearch className="hidden md:block" />
              <ThemeToggle />
              <NotificationsPopover />
              <Button
                size="sm"
                onClick={async () => {
                  const id = await createSong({ title: "Nova canção" });
                  navigate(`/songs/${id}/edit`);
                }}
                className="hidden sm:inline-flex rounded-full bg-gradient-hero text-primary-foreground shadow-glow hover:opacity-90"
              >
                <Sparkles className="h-4 w-4" />
                Nova canção
              </Button>
              <Link to="/profile" className="md:hidden">
                <UserAvatar user={me} size="sm" />
              </Link>
            </div>
          </header>
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 overflow-x-hidden pb-20 md:pb-0"
          >
            <Outlet />
          </motion.main>
          <MobileNav />
        </div>
      </div>
    </SidebarProvider>
  );
}
