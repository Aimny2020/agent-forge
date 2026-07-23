import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function TopNavigation() {
  const { t } = useTranslation();
  const navigation = [
    { label: t('navigation.projects'), to: '/projects' },
    { label: t('navigation.agents'), to: '/agents' },
    { label: t('navigation.skills'), to: '/skills' },
    { label: t('navigation.harness'), to: '/harness' },
    { label: t('navigation.settings'), to: '/settings' },
  ];
  return (
    <header className="top-navigation">
      <div className="brand-lockup">
        <strong>AgentPalette</strong>
        <span>{t('navigation.productTagline')}</span>
      </div>
      <nav className="global-navigation" aria-label={t('navigation.globalNavigation')}>
        {navigation.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
