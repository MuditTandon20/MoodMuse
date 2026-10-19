import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Music, Wand2, Film, Library } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const path = location.pathname;

  const links = [
    { to: '/', icon: <Wand2 size={18} />, label: 'Create' },
    { to: '/cinematic', icon: <Film size={18} />, label: 'Cinematic' },
    { to: '/library', icon: <Library size={18} />, label: 'My Creations' },
  ];

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
        <Music size={24} />
        MoodMuse Studio
      </Link>
      <ul className="navbar-nav">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className={`nav-link ${path === link.to ? 'active' : ''}`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
