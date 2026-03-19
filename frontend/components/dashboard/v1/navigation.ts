import type { LucideIcon } from "lucide-react";
import {
  Activity,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldCheck,
  Users,
  UserSquare2,
} from "lucide-react";

import type { AuthSessionUser } from "@/components/auth/AuthSessionProvider";
import { DASHBOARD_V1_PATHS, getDashboardV1Path } from "@/components/dashboard/v1/routing";

type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type DashboardNavSection = {
  id: string;
  title: string;
  items: DashboardNavItem[];
};

const commonItems: DashboardNavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Profile Studio",
    href: DASHBOARD_V1_PATHS.profile.edit,
    icon: UserSquare2,
  },
  {
    label: "Account",
    href: "/account",
    icon: UserSquare2,
  },
];

const clientItems: DashboardNavItem[] = [
  {
    label: "My Dashboard",
    href: DASHBOARD_V1_PATHS.client,
    icon: Activity,
  },
  {
    label: "Explore Experts",
    href: "/results",
    icon: Users,
  },
];

const partnerItemsBySubtype: Record<string, DashboardNavItem[]> = {
  body_expert: [
    { label: "Body Expert", href: DASHBOARD_V1_PATHS.partner.body_expert, icon: Activity },
    { label: "Clients", href: "/results", icon: Users },
  ],
  mind_expert: [
    { label: "Mind Expert", href: DASHBOARD_V1_PATHS.partner.mind_expert, icon: Activity },
    { label: "Sessions", href: "/results", icon: Users },
  ],
  diet_expert: [
    { label: "Diet Expert", href: DASHBOARD_V1_PATHS.partner.diet_expert, icon: Activity },
    { label: "Meal Plans", href: "/results", icon: Users },
  ],
  mutiple_roles: [
    { label: "Multi Role", href: DASHBOARD_V1_PATHS.partner.mutiple_roles, icon: ShieldCheck },
    { label: "Unified Inbox", href: "/results", icon: MessageSquare },
  ],
  brand: [
    { label: "Brand Console", href: DASHBOARD_V1_PATHS.partner.brand, icon: ShieldCheck },
    { label: "Campaigns", href: "/results", icon: MessageSquare },
  ],
  influencer: [
    { label: "Influencer Hub", href: DASHBOARD_V1_PATHS.partner.influencer, icon: ShieldCheck },
    { label: "Audience", href: "/results", icon: Users },
  ],
};

export function getDashboardNavSections(user: AuthSessionUser): DashboardNavSection[] {
  const sections: DashboardNavSection[] = [];

  const homePath = getDashboardV1Path({
    userType: user.userType,
    userSubtype: user.userSubtype,
  });

  if (homePath) {
    sections.push({
      id: "primary",
      title: "Primary",
      items: [
        {
          label: "Overview",
          href: homePath,
          icon: LayoutDashboard,
        },
      ],
    });
  }

  if (user.userType === "client") {
    sections.push({
      id: "role",
      title: "Client",
      items: clientItems,
    });
  }

  if (user.userType === "partner" && user.userSubtype) {
    const roleItems = partnerItemsBySubtype[user.userSubtype] ?? [];
    if (roleItems.length > 0) {
      sections.push({
        id: "role",
        title: "Partner",
        items: roleItems,
      });
    }
  }

  sections.push({
    id: "common",
    title: "Common",
    items: [...commonItems, { label: "Profile Settings", href: DASHBOARD_V1_PATHS.profile.settings, icon: Settings }],
  });

  return sections;
}

export type { DashboardNavItem, DashboardNavSection };
