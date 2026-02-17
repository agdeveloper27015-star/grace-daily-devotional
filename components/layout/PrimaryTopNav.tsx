import React from 'react';
import { AppView } from '../../types';

interface PrimaryTopNavProps {
  mode: 'home' | 'compact';
  currentView: AppView;
  greeting: string;
  displayName: string;
  onNavigate: (view: AppView) => void;
}

const NAV_TABS: Array<{ view: AppView; label: string }> = [
  { view: 'ESTUDO', label: 'Inicio' },
  { view: 'LEITURA', label: 'Leitura' },
  { view: 'BUSCA', label: 'Busca' },
  { view: 'CADERNO', label: 'Caderno' },
  { view: 'PERFIL', label: 'Perfil' },
];

const getInitials = (displayName: string): string => {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'US';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const PrimaryTopNav: React.FC<PrimaryTopNavProps> = ({ mode, currentView, greeting, displayName, onNavigate }) => {
  return (
    <header className={`top-nav top-nav--${mode}`}>
      <div className="top-nav__inner">
        <div className="top-nav__home-row">
          <h1 className="top-nav__greeting">{greeting}, {displayName}</h1>
          <button
            type="button"
            className="top-nav__avatar"
            onClick={() => onNavigate('PERFIL')}
            aria-label="Abrir perfil"
          >
            <span>{getInitials(displayName)}</span>
          </button>
        </div>

        <nav className="top-nav__tabs" aria-label="Navegacao principal">
          {NAV_TABS.map((tab) => (
            <button
              key={tab.view}
              type="button"
              className="top-nav__tab"
              data-active={currentView === tab.view}
              aria-current={currentView === tab.view ? 'page' : undefined}
              onClick={() => onNavigate(tab.view)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default PrimaryTopNav;
