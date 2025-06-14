if (typeof window !== 'undefined') {
  window.location.assign('http://localhost');
}

process.env.VITE_PORTFOLIO_API = 'http://localhost/api';
