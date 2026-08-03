import React from 'react';
import { NavLink } from 'react-router-dom';
import coraux from '../../assets/image/accueil/coraux.png';

const facts = [
  { icon: '🪸', stat: '50%', label: 'des récifs coralliens ont disparu depuis 1950' },
  { icon: '🌡️', stat: '+1,5°C', label: 'de réchauffement causerait la mort de 70–90% des coraux' },
  { icon: '🐟', stat: '25%', label: 'des espèces marines dépendent des récifs coralliens' },
  { icon: '💶', stat: '375 Mrd€', label: 'de valeur économique annuelle des océans' },
];

const actions = [
  { icon: '🧪', title: 'Restauration des récifs', description: 'Des techniques de nurserie sous-marine permettent de replanter des fragments de coraux sains sur les récifs endommagés.' },
  { icon: '🛡️', title: 'Zones marines protégées', description: 'La création de zones sans pêche permet aux écosystèmes marins de se régénérer naturellement.' },
  { icon: '🌿', title: 'Réduction de la pollution', description: 'Limiter les rejets de plastique et de produits chimiques en mer est vital pour la survie des coraux.' },
];

const Oceans: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-16">
      {/* Hero */}
      <section className="relative">
        <img src={coraux} alt="Coraux" className="w-full h-72 md:h-96 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 to-transparent flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
            <span className="text-blue-200 text-sm font-medium uppercase tracking-wide">Thématique</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-1">
              Océans & Coraux
            </h1>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Intro */}
        <section className="py-10 max-w-3xl">
          <p className="text-lg text-gray-700 leading-relaxed">
            Les océans couvrent <strong>71% de la surface</strong> de notre planète et abritent une biodiversité extraordinaire. 
            Les récifs coralliens, surnommés les « forêts tropicales de la mer », constituent l'un des écosystèmes 
            les plus riches mais aussi les plus menacés du monde.
          </p>
          <p className="text-gray-600 mt-4 leading-relaxed">
            Le réchauffement climatique, la pollution plastique, l'acidification des océans et la pêche illégale 
            mettent en péril ces trésors naturels à une vitesse alarmante. Agir maintenant est une nécessité absolue.
          </p>
        </section>

        {/* Key facts */}
        <section className="py-6 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Chiffres clés</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {facts.map((fact) => (
              <div key={fact.stat} className="bg-blue-50 rounded-xl p-5 text-center">
                <span className="text-3xl">{fact.icon}</span>
                <p className="text-2xl font-bold text-blue-700 mt-2">{fact.stat}</p>
                <p className="text-xs text-gray-600 mt-1 leading-tight">{fact.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Menaces */}
        <section className="py-8 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Les principales menaces</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: '🌡️ Réchauffement climatique', text: 'La hausse des températures provoque le blanchissement des coraux. Un corail blanchi n\'est pas mort, mais est considérablement affaibli.' },
              { title: '🧴 Acidification des océans', text: 'L\'absorption de CO₂ rend l\'eau de mer plus acide, dissolvant les squelettes calcaires des coraux et mollusques.' },
              { title: '🎣 Surpêche', text: 'Elle déstabilise l\'équilibre des espèces marines, appauvrissant la biodiversité des récifs.' },
              { title: '🛢️ Pollution plastique', text: '8 millions de tonnes de plastique entrent dans les océans chaque année, étouffant la vie marine.' },
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
              <div key={action.title} className="bg-white rounded-xl shadow-sm p-5 border border-blue-100 hover:shadow-md transition-shadow">
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
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors"
          >
            💙 Protéger les océans
          </NavLink>
          <NavLink
            to="/news"
            className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Voir les actualités
          </NavLink>
        </section>
      </div>
    </div>
  );
};

export default Oceans;
