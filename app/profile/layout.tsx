"use client";

import { useAuth } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/");
        }
    }, [user, loading, router]);

    if (loading) return <div className="p-12 text-center text-gray-400">Loading profile...</div>;
    if (!user) return null;

    const tabs = [
        { name: "My Attempts", href: "/profile/attempts", icon: "📝" },
        { name: "Performance", href: "/profile/performance", icon: "📊" },
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <aside className="w-full md:w-64 space-y-2">
                    <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm mb-6 text-center">
                        <div className="h-20 w-20 bg-green-100 text-green-700 rounded-[2rem] flex items-center justify-center font-black text-2xl mx-auto mb-4 border-4 border-white shadow-xl">
                            {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                        </div>
                        <h2 className="font-bold text-gray-900 truncate">{user.displayName || user.email?.split('@')[0]}</h2>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>

                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <a
                                key={tab.href}
                                href={tab.href}
                                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${pathname === tab.href
                                        ? "bg-green-600 text-white shadow-lg shadow-green-100"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                            >
                                <span className="text-xl">{tab.icon}</span>
                                {tab.name}
                            </a>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
