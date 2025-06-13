if (typeof window !== 'undefined') {
  window.location.assign('http://localhost');
}

process.env.VITE_API_URL = 'http://localhost/api';
