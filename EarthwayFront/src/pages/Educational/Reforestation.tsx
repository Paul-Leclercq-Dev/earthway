import React from 'react';
import { NavLink } from 'react-router-dom';
import reforestation from '../../assets/image/accueil/reforestation.png';

const facts = [
  { icon: '🌳', stat: '15 Mrd', label: 'arbres abattus chaque année dans le monde' },
  { icon: '🌍', stat: '10 M ha', label: 'de forêts disparaissent chaque année' },
  { icon: '🌡️', stat: '20%', label: 'des émissions de CO₂ mondiales dues à la déforestation' },
  { icon: '🐾', stat: '80%', label: 'de la biodiversité terrestre vit dans les forêts' },
];

const actions = [
  { icon: '🌱', title: 'Plantation d\'arbres', description: 'Des programmes de plantation massifs dans les zones défrichées permettent de reconstituer les couvertures forestières et de capturer du CO₂.' },
  { icon: '🏘️', title: 'Soutien aux communautés locales', description: 'Rémunérer les communautés pour la protection des forêts est plus efficace que toute réglementation externe.' },
  { icon: '📡', title: 'Surveillance par satellite', description: 'Des technologies de télédétection permettent de détecter la déforestation illégale en temps réel et d\'agir rapidement.' },
];

const Reforestation: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-lime-50 to-white pt-16">
      {/* Hero */}
      <section className="relative">
        <img src={reforestation} alt="Reforestation" className="w-full h-72 md:h-96 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-green-900/70 to-transparent flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
            <span className="text-lime-200 text-sm font-medium uppercase tracking-wide">Thématique</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-1">
              Reforestation
            </h1>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Intro */}
        <section className="py-10 max-w-3xl">
          <p className="text-lg text-gray-700 leading-relaxed">
            Les forêts sont les <strong>poumons de la Terre</strong>. Elles absorbent le CO₂, régulent le cycle 
            de l'eau, stabilisent les sols et abritent des millions d'espèces végétales et animales.
          </p>
          <p className="text-gray-600 mt-4 leading-relaxed">
            Pourtant, chaque minute, l'équivalent de <strong>27 terrains de football</strong> de forêt disparaît 
            sur Terre. La déforestation est l'une des causes majeures du changement climatique et de l'effondrement 
            de la biodiversité. La reforestation est l'une des solutions les plus efficaces et les plus accessibles 
            pour y répondre.
          </p>
        </section>

        {/* Key facts */}
        <section className="py-6 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Chiffres clés</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {facts.map((fact) => (
              <div key={fact.stat} className="bg-lime-50 rounded-xl p-5 text-center">
                <span className="text-3xl">{fact.icon}</span>
                <p className="text-2xl font-bold text-lime-700 mt-2">{fact.stat}</p>
                <p className="text-xs text-gray-600 mt-1 leading-tight">{fact.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Causes */}
        <section className="py-8 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pourquoi les forêts disparaissent</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: '🌾 Agriculture intensive', text: 'L\'expansion des terres agricoles (soja, huile de palme, élevage bovin) est la première cause de déforestation en Amazonie et en Asie du Sud-Est.' },
              { title: '🪵 Exploitation forestière', text: 'L\'exploitation légale et illégale du bois détruit des millions d\'hectares de forêts primaires chaque année.' },
              { title: '🏗️ Urbanisation', text: 'L\'extension des villes et la construction d\'infrastructures empiètent sur les zones forestières, surtout dans les pays en développement.' },
              { title: '🔥 Incendies criminels', text: 'Des feux sont parfois délibérément allumés pour défricher des terres, avec des conséquences catastrophiques sur des superficies immenses.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Solutions */}
        <section className="py-8 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ce qu'Earthway finance</h2>
          <p className="text-gray-600 mb-6">Votre abonnement soutient directement ces initiatives :</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {actions.map((action) => (
              <div key={action.title} className="bg-white rounded-xl shadow-sm p-5 border border-lime-100 hover:shadow-md transition-shadow">
                <span className="text-3xl">{action.icon}</span>
                <h3 className="font-semibold text-gray-800 mt-3 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{action.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-10 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-start">
          <NavLink
            to="/subscriptions"
            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg shadow hover:bg-emerald-700 transition-colors"
          >
            🌳 Planter des arbres
          </NavLink>
          <NavLink
            to="/news"
            className="px-6 py-3 bg-white text-emerald-600 font-semibold rounded-lg border-2 border-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            Voir les actualités
          </NavLink>
        </section>
      </div>
    </div>
  );
};

export default Reforestation;
