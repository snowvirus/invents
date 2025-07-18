import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  Building2,
  Users,
  HelpCircle,
  PlusSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    roles: ['customer', 'admin', 'superadmin'],
  },
  {
    name: 'Products',
    href: '/products',
    icon: Package,
    roles: ['customer', 'admin', 'superadmin'],
  },
  {
    name: 'Orders',
    href: '/orders',
    icon: ShoppingCart,
    roles: ['customer', 'admin', 'superadmin'],
    badge: 'pending',
  },
  {
    name: 'Custom Order',
    href: '/custom-order',
    icon: PlusSquare,
    roles: ['customer'],
  },
  {
    name: 'Inquiries',
    href: '/orders?type=inquiry',
    icon: HelpCircle,
    roles: ['customer', 'admin', 'superadmin'],
    badge: 'new',
  },
  {
    name: 'Chatroom',
    href: '/chatroom',
    icon: MessageSquare,
    roles: ['customer', 'admin', 'superadmin'],
  },
];

const adminNavigation = [
  {
    name: 'Branches',
    href: '/branches',
    icon: Building2,
    roles: ['superadmin'],
  },
  {
    name: 'Admins',
    href: '/branches?tab=admins',
    icon: Users,
    roles: ['superadmin'],
  },
];

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === '/') {
      return location === '/';
    }
    return location.startsWith(href);
  };

  const hasAccess = (roles: string[]) => {
    return user?.role && roles.includes(user.role);
  };

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <nav className="space-y-2">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navigation.map((item) => {
              if (!hasAccess(item.roles)) return null;
              
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive(item.href)
                        ? "text-primary bg-blue-50"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.name}
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        5
                      </Badge>
                    )}
                  </a>
                </Link>
              );
            })}
          </div>
          
          {/* Admin Navigation */}
          {user?.role === 'superadmin' && (
            <div className="space-y-1 pt-4">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Administration
              </h3>
              {adminNavigation.map((item) => {
                if (!hasAccess(item.roles)) return null;
                
                return (
                  <Link key={item.name} href={item.href}>
                    <a
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive(item.href)
                          ? "text-primary bg-blue-50"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </a>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}
