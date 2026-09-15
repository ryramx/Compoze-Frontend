import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Music4, Disc3, Newspaper, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Alinhado à doc de UI (seção 10): Home, Canções, Projetos, Feed, Perfil.
// "Pastas" saiu daqui — continua acessível no mobile pelo menu da sidebar
// (SidebarTrigger no header abre o off-canvas com todos os itens).
const items = [
  { title: "Home", url: "/", icon: LayoutDashboard, end: true },
  { title: "Canções", url: "/songs", icon: Music4 },
  { title: "Projetos", url: "/projects", icon: Disc3 },
  { title: "Feed", url: "/feed", icon: Newspaper },
  { title: "Perfil", url: "/profile", icon: UserIcon },
];

export function MobileNav() {
  const { pathname } = useLocation();
  if (pathname.includes("/edit")) return null;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const isActive = item.end ? pathname === item.url : pathname.startsWith(item.url);
          return (
            <li key={item.url}>
              <NavLink
                to={item.url}
                end={item.end}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    isActive && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]",
                  )}
                />
                <span>{item.title}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}