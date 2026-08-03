import { NavLink } from "react-router-dom";
import { useAuth } from "../Hooks/useAuth";
import logo from "../assets/image/logo/logo-earthway.png";

export default function Nav() {
    const { isAuthenticated, logout, user } = useAuth();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <NavLink to="/" className="flex items-center space-x-2">
                            <img src={logo} alt="Earthway" className="h-10 w-auto" />
                        </NavLink>
                    </div>

                    {/* Navigation principale (desktop) */}
                    <div className="hidden md:flex md:items-center md:space-x-6">
                        <NavLink 
                            to="/" 
                            className={({ isActive }) => 
                                `text-sm font-medium transition-colors ${
                                    isActive ? 'text-emerald-600' : 'text-gray-700 hover:text-emerald-600'
                                }`
                            }
                        >
                            Accueil
                        </NavLink>

                        <NavLink 
                            to="/news" 
                            className={({ isActive }) => 
                                `text-sm font-medium transition-colors ${
                                    isActive ? 'text-emerald-600' : 'text-gray-700 hover:text-emerald-600'
                                }`
                            }
                        >
                            Actualités
                        </NavLink>

                        <NavLink 
                            to="/subscriptions" 
                            className={({ isActive }) => 
                                `text-sm font-medium transition-colors ${
                                    isActive ? 'text-emerald-600' : 'text-gray-700 hover:text-emerald-600'
                                }`
                            }
                        >
                            Abonnements
                        </NavLink>

                        <NavLink 
                            to="/donations" 
                            className={({ isActive }) => 
                                `text-sm font-medium transition-colors ${
                                    isActive ? 'text-emerald-600' : 'text-gray-700 hover:text-emerald-600'
                                }`
                            }
                        >
                            Dons
                        </NavLink>

                        <NavLink 
                            to="/marketplace" 
                            className={({ isActive }) => 
                                `text-sm font-medium transition-colors ${
                                    isActive ? 'text-emerald-600' : 'text-gray-700 hover:text-emerald-600'
                                }`
                            }
                        >
                            Marketplace
                        </NavLink>

                        {isAuthenticated ? (
                            <>
                                <NavLink 
                                    to="/profile" 
                                    className={({ isActive }) => 
                                        `text-sm font-medium transition-colors ${
                                            isActive ? 'text-emerald-600' : 'text-gray-700 hover:text-emerald-600'
                                        }`
                                    }
                                >
                                    Profil
                                </NavLink>
                                <button
                                    onClick={logout}
                                    className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                                >
                                    Déconnexion
                                </button>
                                <div className="flex items-center space-x-2 ml-4 px-4 py-2 bg-emerald-50 rounded-full">
                                    <span className="text-sm font-medium text-emerald-700">
                                        {user?.firstName} {user?.lastName}
                                    </span>
                                    <span className="text-xs text-emerald-600">Niveau {user?.level}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <NavLink 
                                    to="/login" 
                                    className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                                >
                                    Connexion
                                </NavLink>
                                <NavLink 
                                    to="/register" 
                                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                                >
                                    Inscription
                                </NavLink>
                            </>
                        )}
                    </div>

                    {/* Bouton menu mobile */}
                    <div className="md:hidden">
                        <button 
                            type="button" 
                            className="text-gray-700 hover:text-emerald-600 focus:outline-none"
                            aria-label="Menu"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation mobile (bottom bar) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
                <div className="grid grid-cols-5 h-16">
                    <NavLink 
                        to="/" 
                        className={({ isActive }) => 
                            `flex flex-col items-center justify-center space-y-1 ${
                                isActive ? 'text-emerald-600' : 'text-gray-600'
                            }`
                        }
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3l8 8h-3v9h-4v-6h-2v6H7v-9H4l8-8z" />
                        </svg>
                        <span className="text-xs">Accueil</span>
                    </NavLink>

                    <NavLink 
                        to="/news" 
                        className={({ isActive }) => 
                            `flex flex-col items-center justify-center space-y-1 ${
                                isActive ? 'text-emerald-600' : 'text-gray-600'
                            }`
                        }
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                        </svg>
                        <span className="text-xs">News</span>
                    </NavLink>

                    <NavLink 
                        to="/subscriptions" 
                        className={({ isActive }) => 
                            `flex flex-col items-center justify-center space-y-1 ${
                                isActive ? 'text-emerald-600' : 'text-gray-600'
                            }`
                        }
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z"/>
                        </svg>
                        <span className="text-xs">Abos</span>
                    </NavLink>

                    <NavLink 
                        to="/marketplace" 
                        className={({ isActive }) => 
                            `flex flex-col items-center justify-center space-y-1 ${
                                isActive ? 'text-emerald-600' : 'text-gray-600'
                            }`
                        }
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                        <span className="text-xs">Market</span>
                    </NavLink>

                    <NavLink 
                        to={isAuthenticated ? "/profile" : "/login"} 
                        className={({ isActive }) => 
                            `flex flex-col items-center justify-center space-y-1 ${
                                isActive ? 'text-emerald-600' : 'text-gray-600'
                            }`
                        }
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        <span className="text-xs">{isAuthenticated ? 'Profil' : 'Compte'}</span>
                    </NavLink>
                </div>
            </div>
        </nav>
    );
}
