import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import Songs from "./pages/app/Songs";
import SongEditor from "./pages/app/SongEditor";
import Folders from "./pages/app/Folders";
import Projects from "./pages/app/Projects";
import ProjectDetail from "./pages/app/ProjectDetail";
import Feed from "./pages/app/Feed";
import Messages from "./pages/app/Messages";
import MapPage from "./pages/app/Map";
import Profile from "./pages/app/Profile";
import Trash from "./pages/app/Trash";
import Settings from "./pages/app/Settings";
import NotFound from "./pages/NotFound";
import { queryClient } from "@/lib/queryClient";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Rotas publicas: quem nao entrou nao ve sidebar nem busca global. */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />

          {/* Tudo abaixo exige sessao. O backend verifica cada requisicao de
              qualquer forma (PRD 26); isto evita telas vazias e chamadas que
              so voltariam 401. */}
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/songs" element={<Songs />} />
              <Route path="/songs/:id/edit" element={<SongEditor />} />
              <Route path="/folders" element={<Folders />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/trash" element={<Trash />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
