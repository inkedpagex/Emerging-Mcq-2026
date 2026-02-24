"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuizStore } from "@/lib/store";
import LoginModal from "@/components/auth/LoginModal";

export default function Navbar() {
    const { user, logout, isAdmin } = useAuth();
    const { isLoginModalOpen, setLoginModal, resetQuiz } = useQuizStore();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Home", href: "/", reset: true },
        { name: "Categories", href: "#categories", reset: false },
        { name: "Leaderboard", href: "/leaderboard", reset: true },
    ];

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isScrolled ? "h-16 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm" : "h-20 bg-transparent"}`}>
                <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => { resetQuiz(); window.location.href = "/"; }}>
                        <div className="h-9 w-9 bg-green-600 rounded-xl flex items-center justify-center transform group-hover:rotate-6 transition-transform shadow-lg shadow-green-100">
                            <span className="text-white font-black text-xl italic">E</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight text-gray-900">
                            Emerging <span className="text-green-600">MCQ</span>
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1 bg-gray-50/50 p-1 rounded-full border border-gray-100">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                onClick={(e) => {
                                    if (link.reset) resetQuiz();
                                    if (link.href.startsWith("#")) {
                                        e.preventDefault();
                                        document.getElementById(link.href.substring(1))?.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }}
                                className="px-5 py-2 rounded-full text-sm font-bold text-gray-400 hover:text-green-600 hover:bg-white hover:shadow-sm transition-all duration-200"
                            >
                                {link.name}
                            </a>
                        ))}
                    </div>

                    {/* Right Side: Auth / Profile */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 p-1.5 rounded-full border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition shadow-sm bg-white"
                                >
                                    <div className="h-8 w-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-black text-xs uppercase">
                                        {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 pr-2 hidden sm:block">
                                        {user.displayName || user.email?.split('@')[0]}
                                    </span>
                                </button>

                                {/* Dropdown Menu */}
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="p-4 bg-gray-50/50 border-b border-gray-50">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Signed in as</p>
                                            <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                                        </div>
                                        <div className="p-2">
                                            <a href="/profile/attempts" className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-green-50 hover:text-green-600 transition flex items-center gap-3">
                                                <span>📝</span> My Attempts
                                            </a>
                                            <a href="/profile/performance" className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-green-50 hover:text-green-600 transition flex items-center gap-3">
                                                <span>📊</span> Performance
                                            </a>
                                            {isAdmin && (
                                                <a href="/admin" className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50 transition flex items-center gap-3">
                                                    <span>⚙️</span> Admin Panel
                                                </a>
                                            )}
                                            <div className="h-[1px] bg-gray-50 my-2 mx-2"></div>
                                            <button
                                                onClick={() => { logout(); setIsProfileOpen(false); }}
                                                className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition flex items-center gap-3"
                                            >
                                                <span>👋</span> Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => setLoginModal(true)}
                                className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-700 transition shadow-xl shadow-green-100 active:scale-95"
                            >
                                Login
                            </button>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2.5 rounded-xl border border-gray-100 text-gray-500 hover:bg-gray-50"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-4 animate-in slide-in-from-top-4 duration-300 shadow-xl">
                        <div className="flex flex-col gap-2">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="px-5 py-4 rounded-2xl text-base font-bold text-gray-600 hover:bg-green-50 hover:text-green-600 transition"
                                >
                                    {link.name}
                                </a>
                            ))}
                            {!user && (
                                <button
                                    onClick={() => { setLoginModal(true); setIsMenuOpen(false); }}
                                    className="mt-4 bg-green-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest"
                                >
                                    Login to Quiz
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModal(false)} />
        </>
    );
}
