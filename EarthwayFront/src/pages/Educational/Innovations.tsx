import React from 'react';
import { NavLink } from 'react-router-dom';
import innovationsImg from '../../assets/image/accueil/innovations.png';

const facts = [
  { icon: '☀️', stat: '90%', label: 'de réduction du coût des panneaux solaires en 10 ans' },
  { icon: '⚡', stat: '30%', label: 'de l\'énergie mondiale issue des renouvelables en 2023' },
  { icon: '🌱', stat: '500+', label: 'startups green-tech fondées chaque année en Europe' },
  { icon: '🔋', stat: '2 000 Mrd$', label: 'investis dans la transition énergétique en 2023' },
];

const innovationsList = [
  { icon: '🌾', title: 'Agriculture régénérative', description: 'Des pratiques agricoles qui restaurent les sols, séquestrent le carbone et réduisent le besoin en intrants chimiques.' },
  { icon: '🏙️', title: 'Villes vertes & biophiliques', description: 'De l\'architecture végétalisée aux forêts urbaines, les villes se transforment pour intégrer la nature et réduire les îlots de chaleur.' },
  { icon: '🔬', title: 'Bioremédiation', description: 'L\'utilisation de micro-organismes et de plantes pour dépolluer les sols et les eaux contaminés par des métaux lourds ou des hydrocarbures.' },
  { icon: '🐚', title: 'Matériaux biosourcés', description: 'Des alternatives écologiques aux plastiques et bétons traditionnels, fabriquées à partir de champignons, de bambou ou d\'algues.' },
  { icon: '💧', title: 'Collecte d\'eau atmosphérique', description: 'Des dispositifs innovants capturent l\'humidité de l\'air pour produire de l\'eau potable dans les zones arides sans source d\'eau.' },
  { icon: '🤖', title: 'IA pour la conservation', description: 'Les algorithmes d\'intelligence artificielle analysent les données satellite pour détecter les espèces, les migrations et les menaces en temps réel.' },
];

const Innovations: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pt-16">
      {/* Hero */}
      <section className="relative">
        <img src={innovationsImg} alt="Innovations" className="w-full h-72 md:h-96 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/70 to-transparent flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
            <span className="text-purple-200 text-sm font-medium uppercase tracking-wide">Thématique</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-1">
              Innovations écologiques
            </h1>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Intro */}
        <section className="py-10 max-w-3xl">
          <p className="text-lg text-gray-700 leading-relaxed">
            Face à l'urgence climatique, <strong>l'ingéniosité humaine</strong> est notre plus grand atout. 
            Des innovations révolutionnaires émergent chaque jour pour nous permettre de vivre mieux 
            tout en préservant notre planète.
          </p>
          <p className="text-gray-600 mt-4 leading-relaxed">
            De l'énergie solaire aux matériaux biosourcés en passant par l'intelligence artificielle au service 
            de la conservation, ces avancées transforment nos modes de vie, de production et de consommation 
            vers un futur plus durable.
          </p>
        </section>

        {/* Key facts */}
        <section className="py-6 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Chiffres clés</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {facts.map((fact) => (
              <div key={fact.stat} className="bg-purple-50 rounded-xl p-5 text-center">
                <span className="text-3xl">{fact.icon}</span>
                <p className="text-2xl font-bold text-purple-700 mt-2">{fact.stat}</p>
                <p className="text-xs text-gray-600 mt-1 leading-tight">{fact.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Innovations grid */}
        <section className="py-8 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Solutions innovantes</h2>
          <p className="text-gray-600 mb-6">Des technologies et approches qui changent la donne :</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {innovationsList.map((item) => (
              <div key={item.title} className="bg-white rounded-xl shadow-sm p-5 border border-purple-100 hover:shadow-md transition-shadow">
                <span className="text-3xl">{item.icon}</span>
                <h3 className="font-semibold text-gray-800 mt-3 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What Earthway does */}
        <section className="py-8 border-t border-gray-100">
          <div className="bg-gradient-to-r from-purple-50 to-emerald-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Earthway & l'innovation</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Earthway soutient les organisations et projets qui expérimentent, prototypent et déploient 
              des solutions écologiques concrètes. En vous abonnant, vous financez directement la recherche 
              et le développement de ces innovations.
            </p>
            <p className="text-gray-600 text-sm">
              Nous sélectionnons rigoureusement nos partenaires ONG et startups sur la base de leur impact 
              mesurable et de leur transparence financière.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-10 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-start">
          <NavLink
            to="/subscriptions"
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow hover:bg-purple-700 transition-colors"
          >
            💡 Soutenir l'innovation verte
          </NavLink>
          <NavLink
            to="/news"
            className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg border-2 border-purple-600 hover:bg-purple-50 transition-colors"
          >
            Voir les actualités
          </NavLink>
        </section>
      </div>
    </div>
  );
};

export default Innovations;
