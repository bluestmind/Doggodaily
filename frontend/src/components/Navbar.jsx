import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './common/LanguageSwitcher';
import {
  FaSearch,
  FaBars,
  FaTimes,
  FaSignInAlt,
  FaUserPlus,
  FaUser,
  FaSignOutAlt,
  FaCog
} from 'react-icons/fa';

/* -------- small hooks -------- */
const useIsMobile = (bp = 768) => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(max-width:${bp}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [bp]);
  return isMobile;
};

const useOutsideClick = (ref, onOutside) => {
  useEffect(() => {
    const handler = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      onOutside?.();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [ref, onOutside]);
};

const Navbar = () => {
  const isMobile = useIsMobile(1024);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const searchRef = useRef(null);
  const menuRef = useRef(null);

  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { t } = useLanguage();

  useOutsideClick(searchRef, () => setSearchOpen(false));
  useOutsideClick(menuRef, () => setUserMenuOpen(false));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/stories', label: t('nav.stories') },
    // { to: '/gallery', label: t('nav.gallery') }, // Disabled for now
    { to: '/tours', label: t('nav.tours') },
    { to: '/book', label: t('nav.book') },
    { to: '/contact', label: t('nav.contact') }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/stories?search=${encodeURIComponent(q)}`);
    setQuery('');
    setSearchOpen(false);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUserMenuOpen(false);
      setMobileOpen(false);
      navigate('/');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <nav
      className={`nav ${scrolled ? 'nav--scrolled' : ''}`}
      role="navigation"
      aria-label="Main"
    >
      <div className="nav__container">
        {/* Logo */}
        <Link to="/" className="nav__logo" aria-label="DoggODaily home">
          <img 
            src="/logo/png B.png" 
            alt="DoggODaily Logo" 
            style={{
              width: '40px',
              height: '40px',
              objectFit: 'contain'
            }}
          />
          <span className="nav__brand">DoggODaily</span>
        </Link>

        {/* Desktop links */}
        {!isMobile && (
          <ul className="nav__links" role="menubar" aria-label="Primary">
            {navLinks.map((l) => (
              <li key={l.to} role="none">
                <NavLink
                  to={l.to}
                  role="menuitem"
                  className={({ isActive }) =>
                    `nav__link ${isActive ? 'is-active' : ''}`
                  }
                >
                  {l.label}
                  <span className="nav__underline" />
                </NavLink>
              </li>
            ))}
          </ul>
        )}

        {/* Right actions (desktop) */}
        {!isMobile && (
          <div className="nav__actions">
            {/* Search */}
            <div className="search" ref={searchRef}>
              <button
                className={`icon-btn ${searchOpen ? 'is-active' : ''}`}
                aria-label={t('nav.search') || 'Search'}
                aria-expanded={searchOpen}
                aria-controls="nav-search"
                onClick={() => setSearchOpen((v) => !v)}
              >
                <FaSearch />
              </button>
              {searchOpen && (
                <form id="nav-search" className="search__panel" onSubmit={handleSearch}>
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('nav.search_placeholder') || 'Search stories…'}
                    onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
                  />
                </form>
              )}
            </div>

            {/* Auth */}
            {isAuthenticated() ? (
              <div className="user" ref={menuRef}>
                <button
                  className="user__btn"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                >
                  <img
                    src={
                      user?.avatar ||
                      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face'
                    }
                    alt=""
                    className="user__avatar"
                  />
                  <span className="user__name">{user?.name || 'User'}</span>
                </button>

                {userMenuOpen && (
                  <div className="menu" role="menu">
                    <Link to="/profile" className="menu__item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                      <FaUser /> {t('nav.profile') || 'Profile'}
                    </Link>
                    {isAdmin() && (
                      <Link to="/admin" className="menu__item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                        <FaCog /> {t('nav.admin') || 'Admin Panel'}
                      </Link>
                    )}
                    <button className="menu__item menu__item--danger" role="menuitem" onClick={handleLogout}>
                      <FaSignOutAlt /> {t('auth.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth">
                <Link to="/login" className="btn btn--ghost">
                  <FaSignInAlt /> {t('auth.login')}
                </Link>
                <Link to="/signup" className="btn btn--primary">
                  <FaUserPlus /> {t('auth.signup')}
                </Link>
              </div>
            )}

            {/* Language */}
            <LanguageSwitcher variant="header" />
          </div>
        )}

        {/* Mobile toggles */}
        {isMobile && (
          <button
            className="icon-btn"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <FaTimes /> : <FaBars />}
          </button>
        )}
      </div>

      {/* Mobile sheet */}
      {isMobile && mobileOpen && (
        <div className="sheet" role="dialog" aria-modal="true">
          <div className="sheet__section">
            <ul className="sheet__links">
              {navLinks.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    className={({ isActive }) =>
                      `sheet__link ${isActive ? 'is-active' : ''}`
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="sheet__section">
            <form onSubmit={handleSearch} className="sheet__search">
              <FaSearch />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('nav.search_placeholder') || 'Search stories…'}
              />
            </form>
          </div>

          <div className="sheet__section">
            {isAuthenticated() ? (
              <>
                <div className="sheet__user">
                  <img
                    src={
                      user?.avatar ||
                      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face'
                    }
                    alt=""
                  />
                  <div className="sheet__user-info">
                    <strong>{user?.name || 'User'}</strong>
                    <small>{user?.email}</small>
                  </div>
                </div>
                <Link to="/profile" className="sheet__btn" onClick={() => setMobileOpen(false)}>
                  <FaUser /> {t('nav.profile') || 'Profile'}
                </Link>
                {isAdmin() && (
                  <Link to="/admin" className="sheet__btn" onClick={() => setMobileOpen(false)}>
                    <FaCog /> {t('nav.admin') || 'Admin Panel'}
                  </Link>
                )}
                <button className="sheet__btn sheet__btn--danger" onClick={handleLogout}>
                  <FaSignOutAlt /> {t('auth.logout')}
                </button>
              </>
            ) : (
              <div className="sheet__auth">
                <Link to="/login" className="btn btn--ghost" onClick={() => setMobileOpen(false)}>
                  <FaSignInAlt /> {t('auth.login')}
                </Link>
                <Link to="/signup" className="btn btn--primary" onClick={() => setMobileOpen(false)}>
                  <FaUserPlus /> {t('auth.signup')}
                </Link>
              </div>
            )}
          </div>

          <div className="sheet__section">
            <LanguageSwitcher variant="default" />
          </div>
        </div>
      )}

      {/* Component styles */}
      <style>{`
        :root{
          --primary: #00bfae;
          --primary-600: #00a693;
          --ink-900:#23303f;
          --ink-700:#2c3e50;
          --ink-500:#607181;
          --surface: rgba(255,255,255,.9);
          --ring: rgba(0,191,174,.22);
        }

        .nav{
          position: sticky; top:0; z-index:1000;
          background: var(--surface);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(0,0,0,.04);
          transition: box-shadow .25s ease, background .25s ease;
        }
        .nav--scrolled{ box-shadow: 0 6px 24px rgba(0,0,0,.06); background: rgba(255,255,255,.95); }

        .nav__container{
          max-width: 1200px; margin-inline:auto;
          padding: .65rem 1rem;
          display:flex; align-items:center; justify-content:space-between; gap:1rem;
        }

        .nav__logo{ display:flex; align-items:center; gap:.5rem; text-decoration:none; }
        .nav__logo img{ border-radius:8px; }
        .nav__brand{
          font-family: Poppins, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
          font-weight: 800; letter-spacing:-.02em;
          background: linear-gradient(135deg,var(--primary),var(--primary-600));
          -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
          font-size: clamp(1.2rem, 2.2vw, 1.6rem);
        }

        .nav__links{
          display:flex; gap:.25rem; list-style:none; margin:0; padding:0;
        }
        .nav__link{
          position:relative; display:inline-flex; align-items:center; padding:.6rem .9rem;
          text-decoration:none; color: var(--ink-700); font-weight:600; border-radius:10px;
          transition: background .2s ease, color .2s ease;
        }
        .nav__link:hover{ background: rgba(0,191,174,.06); }
        .nav__link.is-active{ color: var(--primary); background: rgba(0,191,174,.1); border:1px solid var(--ring); }
        .nav__underline{
          position:absolute; left:.9rem; right:.9rem; bottom: .45rem; height:2px;
          border-radius:2px; background: currentColor; opacity:0; transform: scaleX(.6);
          transition: transform .25s ease, opacity .25s ease;
        }
        .nav__link:hover .nav__underline{ opacity:.35; transform: scaleX(1); }

        .nav__actions{ display:flex; align-items:center; gap:.75rem; }

        .btn{
          display:inline-flex; align-items:center; gap:.5rem; padding:.55rem .9rem;
          border-radius:10px; font-weight:700; text-decoration:none; font-size:.95rem;
          transition: transform .2s ease, box-shadow .2s ease, background .2s ease, color .2s ease, border-color .2s ease;
        }
        .btn--primary{ background: var(--primary); color:#fff; border:1px solid var(--primary-600); }
        .btn--primary:hover{ transform: translateY(-1px); box-shadow:0 6px 16px rgba(0,191,174,.28); }
        .btn--ghost{ background: transparent; color: var(--primary); border:1px solid var(--primary); }
        .btn--ghost:hover{ background: var(--primary); color:#fff; }

        .icon-btn{
          display:inline-grid; place-items:center; width:38px; height:38px;
          background: rgba(0,191,174,.1); color: var(--primary);
          border:1px solid var(--ring); border-radius:10px; cursor:pointer;
          transition: transform .2s ease, background .2s ease, box-shadow .2s ease;
        }
        .icon-btn:hover{ transform: translateY(-1px); background: rgba(0,191,174,.15); box-shadow:0 6px 16px rgba(0,191,174,.22); }
        .icon-btn.is-active{ background: rgba(0,191,174,.2); }

        .search{ position:relative; }
        .search__panel{
          position:absolute; top:calc(100% + .5rem); right:0; z-index:10;
          background:#fff; border:1px solid var(--ring); border-radius:12px; padding:.8rem;
          box-shadow:0 12px 28px rgba(0,0,0,.12); width:min(320px, 70vw);
        }
        .search__panel input{
          width:100%; padding:.65rem .75rem; border:1px solid var(--ring); border-radius:8px; font-size:.95rem;
          outline:none; transition: border-color .2s ease;
        }
        .search__panel input:focus{ border-color: var(--primary); box-shadow: 0 0 0 3px rgba(0,191,174,.15); }

        .user{ position:relative; }
        .user__btn{
          display:flex; align-items:center; gap:.5rem; background: rgba(0,191,174,.08);
          border:1px solid var(--ring); color: var(--primary); border-radius:10px; padding:.4rem .6rem; cursor:pointer;
        }
        .user__avatar{ width:26px; height:26px; border-radius:50%; object-fit:cover; }
        .user__name{ font-weight:700; font-size:.95rem; color: var(--ink-700); }

        .menu{
          position:absolute; top:calc(100% + .5rem); right:0; z-index:15;
          background:#fff; border:1px solid rgba(0,0,0,.06); border-radius:12px; min-width:220px;
          box-shadow:0 12px 28px rgba(0,0,0,.12); overflow:hidden;
        }
        .menu__item{
          display:flex; align-items:center; gap:.6rem; padding:.8rem 1rem;
          color: var(--ink-700); text-decoration:none; font-weight:600;
          transition: background .2s ease;
        }
        .menu__item:hover{ background: rgba(0,191,174,.06); }
        .menu__item--danger{ color:#e74c3c; width:100%; background:transparent; border:none; text-align:left; }
        .menu__item--danger:hover{ background: rgba(231,76,60,.08); }

        .sheet{
          position:absolute; left:0; right:0; top:100%;
          background: rgba(255,255,255,.98); backdrop-filter: blur(12px);
          border-top:1px solid rgba(0,0,0,.06);
          animation: slideDown .25s ease;
          z-index: 900;
        }
        .sheet__section{ padding:1rem 1.25rem; border-bottom:1px solid rgba(0,0,0,.05); }
        .sheet__links{ list-style:none; margin:0; padding:0; display:grid; gap:.35rem; }
        .sheet__link{
          display:block; padding:.85rem .9rem; border-radius:10px; text-decoration:none; font-weight:700;
          color: var(--ink-700); background: transparent; border:1px solid transparent;
        }
        .sheet__link:hover{ background: rgba(0,191,174,.06); }
        .sheet__link.is-active{ color: var(--primary); background: rgba(0,191,174,.1); border-color: var(--ring); }

        .sheet__search{ display:flex; align-items:center; gap:.6rem; border:1px solid var(--ring); border-radius:10px; padding:.55rem .7rem; }
        .sheet__search input{ border:none; outline:none; width:100%; font-size:1rem; background:transparent; }

        .sheet__user{ display:flex; align-items:center; gap:.75rem; }
        .sheet__user img{ width:40px; height:40px; border-radius:50%; object-fit:cover; }
        .sheet__user-info small{ color: var(--ink-500); }

        .sheet__btn{
          display:flex; align-items:center; gap:.6rem; margin-top:.5rem; width:100%;
          padding:.85rem .9rem; border-radius:10px; border:1px solid rgba(0,0,0,.06);
          background:#fff; color: var(--ink-700); font-weight:700;
        }
        .sheet__btn:hover{ background: rgba(0,191,174,.06); }
        .sheet__btn--danger{ color:#e74c3c; border-color: rgba(231,76,60,.18); }
        .sheet__auth{ display:flex; gap:.5rem; }

        @keyframes slideDown{ from{ opacity:0; transform: translateY(-6px) } to{ opacity:1; transform: translateY(0) } }

        /* accessibility */
        .nav a:focus-visible, .btn:focus-visible, .icon-btn:focus-visible, .user__btn:focus-visible, .menu__item:focus-visible, .sheet__link:focus-visible, .sheet__btn:focus-visible, .search__panel input:focus-visible{
          outline: none;
          box-shadow: 0 0 0 3px rgba(0,191,174,.25);
        }

        @media (prefers-reduced-motion: reduce){
          *{ animation:none !important; transition:none !important; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
