import { NavLink } from "react-router-dom"
import AdSlot from '../components/AdSlot'

import reforestation from "../assets/image/accueil/reforestation.png"
import coraux from "../assets/image/accueil/coraux.png"
import pollinisateurs from "../assets/image/accueil/pollinisateurs.png"
import innovations from "../assets/image/accueil/innovations.png"
import earthway from "../assets/image/logo/logo-earthway.png"

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
            {/* Hero Section - Value Proposition */}
            <section className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <img src={earthway} alt="Earthway Logo" className="h-20 w-24 mb-6" />
                
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 max-w-3xl">
                    Agissez pour la planète, <br />
                    <span className="text-emerald-600">un geste à la fois</span>
                </h1>
                
                <p className="text-lg md:text-xl text-gray-700 mb-6 max-w-2xl">
                    Earthway vous permet de soutenir des projets environnementaux concrets : 
                    reforestation, protection des océans, sauvegarde des pollinisateurs et innovations écologiques.
                </p>

                <p className="text-base text-gray-600 mb-8 max-w-xl">
                    <strong className="text-emerald-600">75% de votre abonnement</strong> est directement reversé aux ONG partenaires. 
                    Suivez votre impact en temps réel et participez à la révolution verte.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                    <NavLink 
                        to="/subscriptions" 
                        className="px-8 py-4 bg-emerald-600 text-white font-semibold rounded-lg shadow-lg hover:bg-emerald-700 transition-colors"
                    >
                        Découvrir les abonnements
                    </NavLink>
                    <NavLink 
                        to="/donations" 
                        className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-lg shadow-lg border-2 border-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                        Faire un don ponctuel
                    </NavLink>
                </div>

                <NavLink 
                    to="/news" 
                    className="text-emerald-600 font-medium hover:text-emerald-700 underline"
                >
                    Consulter les actualités environnementales →
                </NavLink>

                <div className="mt-10 w-full max-w-4xl">
                    <AdSlot placement="home_hero" />
                </div>
            </section>

            {/* Thématiques Section */}
            <section className="px-6 pb-12">
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
                    Nos 4 thématiques d'action
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {/* Reforestation */}
                    <NavLink 
                        to="/reforestation" 
                        className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
                    >
                        <img 
                            className="h-64 w-full object-cover" 
                            src={reforestation} 
                            alt="Reforestation - Plantez des arbres pour lutter contre le changement climatique" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                            <div>
                                <h3 className="text-white text-xl font-bold mb-1">Reforestation</h3>
                                <p className="text-white/90 text-sm">Plantez des arbres pour restaurer la planète</p>
                            </div>
                        </div>
                    </NavLink>

                    {/* Coraux */}
                    <NavLink 
                        to="/oceans" 
                        className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
                    >
                        <img 
                            className="h-64 w-full object-cover" 
                            src={coraux} 
                            alt="Protection des océans - Sauvez les récifs coralliens" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                            <div>
                                <h3 className="text-white text-xl font-bold mb-1">Océans & Coraux</h3>
                                <p className="text-white/90 text-sm">Protégez les récifs et la biodiversité marine</p>
                            </div>
                        </div>
                    </NavLink>

                    {/* Pollinisateurs */}
                    <NavLink 
                        to="/pollinisateurs" 
                        className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
                    >
                        <img 
                            className="h-64 w-full object-cover" 
                            src={pollinisateurs} 
                            alt="Protection des pollinisateurs - Sauvez les abeilles et papillons" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                            <div>
                                <h3 className="text-white text-xl font-bold mb-1">Pollinisateurs</h3>
                                <p className="text-white/90 text-sm">Sauvez les abeilles et papillons essentiels</p>
                            </div>
                        </div>
                    </NavLink>

                    {/* Innovations */}
                    <NavLink 
                        to="/innovations" 
                        className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
                    >
                        <img 
                            className="h-64 w-full object-cover" 
                            src={innovations} 
                            alt="Innovations écologiques - Soutenez les technologies vertes" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                            <div>
                                <h3 className="text-white text-xl font-bold mb-1">Innovations</h3>
                                <p className="text-white/90 text-sm">Soutenez les technologies vertes du futur</p>
                            </div>
                        </div>
                    </NavLink>
                </div>
            </section>

            {/* Trust Section */}
            <section className="bg-emerald-600 text-white py-12 px-6 text-center">
                <h2 className="text-3xl font-bold mb-4">Transparence totale sur votre impact</h2>
                <p className="text-lg mb-6 max-w-2xl mx-auto">
                    Grâce à notre tableau de bord personnalisé, suivez en temps réel le nombre d'arbres plantés, 
                    de coraux restaurés et de pollinisateurs protégés grâce à votre contribution.
                </p>
                <NavLink 
                    to="/register" 
                    className="inline-block px-8 py-4 bg-white text-emerald-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
                >
                    Créer mon compte gratuitement
                </NavLink>
            </section>
        </div>
    )
}
