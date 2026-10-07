import { Link, useLocation, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Building2,
  Download,
  FileUp,
  ListChecks,
  LogOut,
  UserRound,
  Wand2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeIcon, ThemeMenu } from "@/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const COMPANY_ITEMS = [
  { to: "/empresas/$companyId", suffix: "", label: "Lançamentos", icon: ListChecks },
  { to: "/empresas/$companyId/importar", suffix: "/importar", label: "Importar OFX", icon: FileUp },
  {
    to: "/empresas/$companyId/plano-de-contas",
    suffix: "/plano-de-contas",
    label: "Plano de contas",
    icon: BookOpen,
  },
  { to: "/empresas/$companyId/regras", suffix: "/regras", label: "Regras", icon: Wand2 },
  { to: "/empresas/$companyId/exportar", suffix: "/exportar", label: "Exportar", icon: Download },
] as const;

export function AppSidebar({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const { pathname } = useLocation();
  const { companyId } = useParams({ strict: false });
  const { isMobile, setOpenMobile } = useSidebar();

  const company = useQuery({
    queryKey: ["company", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, cnpj")
        .eq("id", companyId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const normalizedPath = pathname.replace(/\/$/, "");
  const companyBase = companyId ? `/empresas/${companyId}` : null;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Contaflux">
              <Link to="/empresas" onClick={closeOnMobile}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary font-serif text-base font-semibold text-sidebar-primary-foreground">
                  C
                </span>
                <span className="font-serif text-xl font-semibold">Contaflux</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Geral</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Empresas"
                  isActive={normalizedPath === "/empresas"}
                >
                  <Link to="/empresas" onClick={closeOnMobile}>
                    <Building2 />
                    <span>Empresas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {companyId && companyBase ? (
          <SidebarGroup>
            <SidebarGroupLabel className="truncate">
              {company.data?.name ?? "Empresa"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {COMPANY_ITEMS.map((item) => {
                  const href = companyBase + item.suffix;
                  const active =
                    item.suffix === ""
                      ? normalizedPath === companyBase
                      : normalizedPath.startsWith(href);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild tooltip={item.label} isActive={active}>
                        <Link
                          to={item.to}
                          params={{ companyId }}
                          search={true}
                          onClick={closeOnMobile}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={email} className="cursor-default hover:bg-transparent active:bg-transparent">
              <UserRound />
              <span className="truncate text-sidebar-foreground/70">{email}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ThemeMenu side={isMobile ? "top" : "right"} align="end">
              <SidebarMenuButton aria-label="Tema">
                <ThemeIcon />
                <span>Tema</span>
              </SidebarMenuButton>
            </ThemeMenu>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sair" onClick={onSignOut}>
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
