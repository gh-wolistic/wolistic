"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Menu,
  X,
  ChevronDown,
  User as UserIcon,
  Building2,
  Heart,
  Sparkles,
  Users,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '../ui/button';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import logoImage from '@/assets/logo_dark_text.png';
import logoLightImage from '@/assets/logo_light_text.png';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { useIsClient } from '@/hooks/use-is-client';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    type: 'client' | 'partner';
  } | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onDashboard?: () => void;
}

type LinkItem = {
  label: string;
  href: string;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  isActive: (pathname: string, scope: string | null) => boolean;
};

const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  const showLength = Math.max(2, Math.ceil(localPart.length * 0.4));
  const visiblePart = localPart.substring(0, Math.min(showLength, localPart.length));
  return `${visiblePart}***@${domain}`;
};

const desktopNavLinkClass = (isActive: boolean) =>
  `rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
    isActive
      ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40'
      : 'text-muted-foreground hover:text-foreground hover:bg-accent/80'
  }`;

const mobileCardLinkClass = (isActive: boolean, activeClassName: string) =>
  `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
    isActive ? activeClassName : 'text-foreground hover:bg-accent/80'
  }`;

const mobileTextLinkClass = (isActive: boolean) =>
  `w-full text-left px-4 py-3 rounded-xl transition-all ${
    isActive
      ? 'text-emerald-600 bg-emerald-50 font-medium dark:text-emerald-300 dark:bg-emerald-950/40'
      : 'text-foreground hover:bg-accent/80'
  }`;

export function PublicHeader({ user = null, onOpenAuth, onLogout, onDashboard }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const isClient = useIsClient();

  const scope = searchParams.get('scope');
  const activeLogo = isClient && resolvedTheme === 'dark' ? logoLightImage : logoImage;

  const discoverItems: LinkItem[] = [
    {
      label: 'Professionals',
      href: '/results?scope=professional',
      description: 'Find certified experts',
      icon: Users,
      iconClassName: 'text-emerald-600',
      isActive: (currentPath, currentScope) => currentPath === '/results' && currentScope === 'professional',
    },
    {
      label: 'Products & Services',
      href: '/results?scope=products',
      description: 'Curated wellness items',
      icon: ShoppingBag,
      iconClassName: 'text-teal-600',
      isActive: (currentPath, currentScope) => currentPath === '/results' && currentScope === 'products',
    },
    {
      label: 'Influencers',
      href: '/results?scope=influencers',
      description: 'Wellness educators',
      icon: Heart,
      iconClassName: 'text-pink-600',
      isActive: (currentPath, currentScope) => currentPath === '/results' && currentScope === 'influencers',
    },
  ];

  const primaryItems: LinkItem[] = [
    {
      label: 'For Partners',
      href: '/partners',
      isActive: (currentPath) => currentPath === '/partners',
    },
    {
      label: 'For Corporates',
      href: '/corporate-wellness',
      isActive: (currentPath) => currentPath === '/corporate-wellness',
    },
  ];

  const companyItems: LinkItem[] = [
    {
      label: 'About',
      href: '/about',
      isActive: (currentPath) => currentPath === '/about',
    },
    {
      label: 'Contact',
      href: '/contact',
      isActive: (currentPath) => currentPath === '/contact',
    },
  ];

  const isDiscoverActive = discoverItems.some((item) => item.isActive(pathname, scope));
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-xl transition-all hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          >
            <Image src={activeLogo} alt="Wolistic" className="h-11 w-auto" priority />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Discover Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  id="discover-menu-trigger"
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
                    isDiscoverActive
                      ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/80'
                  }`}
                >
                  <Sparkles size={16} />
                  Search
                  <ChevronDown size={16} className="opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {discoverItems.map((item) => {
                  const ItemIcon = item.icon;

                  return (
                    <DropdownMenuItem key={item.href} asChild className="cursor-pointer py-3">
                      <Link href={item.href}>
                        {ItemIcon ? <ItemIcon size={18} className={`mr-3 ${item.iconClassName ?? ''}`} /> : null}
                        <div>
                          <p className="font-medium">{item.label}</p>
                          {item.description ? <p className="text-xs text-muted-foreground">{item.description}</p> : null}
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {[...primaryItems, ...companyItems].map((item) => (
              <Link key={item.href} href={item.href} className={desktopNavLinkClass(item.isActive(pathname, scope))}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth/User Menu */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeSwitcher />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="group flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-linear-to-r from-emerald-400 to-teal-600 text-white text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.name.split(' ')[0]}</span>
                    <ChevronDown size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-2">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{maskEmail(user.email)}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {onDashboard && (
                    <DropdownMenuItem onClick={onDashboard} className="cursor-pointer">
                      <UserIcon size={16} className="mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                  )}
                  {onLogout && (
                    <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600">
                      Sign Out
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                {onOpenAuth && (
                  <>
                    <Button
                      onClick={onOpenAuth}
                      variant="ghost"
                      size="sm"
                      className="rounded-xl font-medium"
                    >
                      Sign In
                    </Button>
                    <Button
                      onClick={onOpenAuth}
                      size="sm"
                      className="bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 rounded-xl font-medium shadow-md hover:shadow-lg transition-all px-6"
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl hover:bg-accent/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            type="button"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border py-6 space-y-4 animate-in slide-in-from-top duration-200">
            {/* Discover Section */}
            <div className="space-y-2">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Discover
              </p>
              {discoverItems.map((item) => {
                const ItemIcon = item.icon;
                const activeClassMap: Record<string, string> = {
                  Professionals: 'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40',
                  'Products & Services': 'text-teal-600 bg-teal-50 dark:text-teal-300 dark:bg-teal-950/40',
                  Influencers: 'text-pink-600 bg-pink-50 dark:text-pink-300 dark:bg-pink-950/40',
                };

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={mobileCardLinkClass(item.isActive(pathname, scope), activeClassMap[item.label])}
                  >
                    {ItemIcon ? <ItemIcon size={20} className={item.iconClassName} /> : null}
                    <div className="text-left">
                      <p className="text-sm font-medium">{item.label}</p>
                      {item.description ? <p className="text-xs text-muted-foreground">{item.description}</p> : null}
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="space-y-2">
              {primaryItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={mobileCardLinkClass(
                    item.isActive(pathname, scope),
                    'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/40'
                  )}
                >
                  <Building2 size={20} className="text-blue-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.label === 'For Partners' ? 'Login/Signup' : 'Wellness programs'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Company Section */}
            <div className="space-y-2">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Company
              </p>
              {companyItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={mobileTextLinkClass(item.isActive(pathname, scope))}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="px-4">
              <ThemeSwitcher />
            </div>

            {/* Auth Section */}
            <div className="pt-4 space-y-3 border-t border-border">
              {user ? (
                <>
                  <div className="px-4 py-3 bg-accent/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-linear-to-r from-emerald-400 to-teal-600 text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{maskEmail(user.email)}</p>
                      </div>
                    </div>
                  </div>
                  {onDashboard && (
                    <Button
                      onClick={() => {
                        onDashboard();
                        setMobileMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full rounded-xl"
                    >
                      Dashboard
                    </Button>
                  )}
                  {onLogout && (
                    <Button
                      onClick={() => {
                        onLogout();
                        setMobileMenuOpen(false);
                      }}
                      variant="ghost"
                      className="w-full rounded-xl text-red-600"
                    >
                      Sign Out
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {onOpenAuth && (
                    <>
                      <Button
                        onClick={() => {
                          onOpenAuth();
                          closeMobileMenu();
                        }}
                        variant="outline"
                        className="w-full rounded-xl"
                      >
                        Sign In
                      </Button>
                      <Button
                        onClick={() => {
                          onOpenAuth();
                          closeMobileMenu();
                        }}
                        className="w-full bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-md"
                      >
                        Get Started
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
