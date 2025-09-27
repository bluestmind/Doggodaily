import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <section style={{ maxWidth: '600px', margin: '3rem auto', padding: '2rem', background: 'rgba(255,255,255,0.97)', borderRadius: '1.5rem', boxShadow: '0 4px 24px rgba(0, 191, 174, 0.10)', textAlign: 'center' }}>
      <img src="https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=400&q=80" alt="Lost dog" className="media" width="180" style={{ display: 'block', margin: '0 auto 1.5rem auto' }} />
      <h2 className="vip-accent" style={{ fontSize: '2rem', marginBottom: '1rem' }}>404 - Page Not Found</h2>
      <p style={{ color: '#12343b', fontSize: '1.1rem', marginBottom: '2rem' }}>
        Oops! The page you’re looking for doesn’t exist. But this dog is happy to see you!
      </p>
      <button onClick={() => navigate('/')} style={{ background: 'linear-gradient(90deg, #00bfae 0%, #0097a7 100%)', color: '#fff', border: 'none', borderRadius: '0.75rem', padding: '0.75rem 2rem', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer', transition: 'background 0.2s' }}
        onMouseOver={e => (e.currentTarget.style.background = 'linear-gradient(90deg, #0097a7 0%, #00bfae 100%)')}
        onMouseOut={e => (e.currentTarget.style.background = 'linear-gradient(90deg, #00bfae 0%, #0097a7 100%)')}
      >
        Go Home
      </button>
    </section>
  );
};

export default NotFoundPage; 