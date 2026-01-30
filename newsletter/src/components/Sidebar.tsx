"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Mail,
    FileText,
    Tags,
    BarChart3,
    Settings,
    Import,
} from "lucide-react";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Contacts", href: "/contacts", icon: Users },
    { name: "Import", href: "/contacts/import", icon: Import },
    { name: "Campaigns", href: "/campaigns", icon: Mail },
    { name: "Templates", href: "/templates", icon: FileText },
    { name: "Tags", href: "/tags", icon: Tags },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden lg:flex lg:flex-shrink-0">
            <div className="flex w-64 flex-col">
                <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-indigo-900 to-indigo-800">
                    {/* Logo */}
                    <div className="flex h-16 flex-shrink-0 items-center px-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                                <span className="text-indigo-900 font-bold text-lg">EDC</span>
                            </div>
                            <div>
                                <h1 className="text-white font-semibold">Newsletter</h1>
                                <p className="text-indigo-300 text-xs">Management System</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex flex-1 flex-col overflow-y-auto">
                        <nav className="flex-1 space-y-1 px-2 py-4">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActive
                                                ? "bg-indigo-700 text-white"
                                                : "text-indigo-100 hover:bg-indigo-700/50"
                                            }`}
                                    >
                                        <item.icon
                                            className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? "text-white" : "text-indigo-300"
                                                }`}
                                        />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Footer */}
                    <div className="flex-shrink-0 p-4">
                        <div className="rounded-lg bg-indigo-800/50 p-3">
                            <p className="text-xs text-indigo-300">
                                European Dealer Council
                            </p>
                            <p className="text-xs text-indigo-400 mt-1">
                                Newsletter v1.0
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
