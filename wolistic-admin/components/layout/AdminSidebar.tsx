"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Users, 
  Shield, 
  ShieldCheck,
  Coins, 
  CreditCard, 
  TicketPercent,
  CheckSquare,
  Settings,
  UserCog,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// Navigation Configuration
// ============================================================================

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  active?: boolean;
}

interface AdminSidebarProps {
  pendingCount?: number;
  onNavigate?: () => void;
}

export function AdminSidebar({ pendingCount = 0, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();

  const sections: NavSection[] = [
    {
      title: "Overview",
      items: [
        {
          label: "Dashboard",
          href: "/dashboard",
          icon: Home,
        },
      ],
    },
    {
      title: "Platform",
      items: [
        {
          label: "Professionals",
          href: "/dashboard/professionals",
          icon: UserCog,
          badge: pendingCount > 0 ? pendingCount : undefined,
        },
        {
          label: "Verifications",
          href: "/dashboard/verifications",
          icon: ShieldCheck,
        },
        {
          label: "Users",
          href: "/dashboard/users",
          icon: Users,
        },
        {
          label: "Audit Logs",
          href: "/dashboard/audit-logs",
          icon: Shield,
        },
      ],
    },
    {
      title: "Configuration",
      items: [
        {
          label: "Coins",
          href: "/dashboard/coins",
          icon: Coins,
        },
        {
          label: "Offers",
          href: "/dashboard/offers",
          icon: TicketPercent,
        },
        {
          label: "Subscriptions",
          href: "/dashboard/subscriptions",
          icon: CreditCard,
        },
        {
          label: "Tasks",
          href: "/dashboard/tasks",
          icon: CheckSquare,
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          label: "Analytics",
          href: "/dashboard/analytics",
          icon: BarChart3,
        },
        {
          label: "Settings",
          href: "/dashboard/settings",
          icon: Settings,
        },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-white/10 bg-slate-900/70 backdrop-blur-xl">
      {/* Logo / Branding */}
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Wolistic</p>
            <p className="text-xs text-slate-400">Admin</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section, idx) => (
          <div key={section.title} className={cn("mb-6", idx > 0 && "mt-6")}>
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-slate-500">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-cyan-500/10 text-cyan-400"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-300"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge
                        variant={active ? "default" : "secondary"}
                        className={cn(
                          "h-5 min-w-[20px] px-1.5 text-xs",
                          active
                            ? "bg-cyan-500 text-white"
                            : "bg-slate-700 text-slate-300"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-xs font-medium text-slate-400">Admin Portal</p>
          <p className="text-[10px] text-slate-500">v1.0.0 • Port :3001</p>
        </div>
      </div>
    </div>
  );
}
