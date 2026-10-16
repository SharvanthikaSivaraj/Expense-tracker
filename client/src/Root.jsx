import App from './App';
import { useAuth } from './auth';
import AuthPage from './views/AuthPage';

export default function Root() {
  const { status } = useAuth();

  if (status === 'loading') return <p className="loading">Loading...</p>;
  return status === 'authed' ? <App /> : <AuthPage />;
}
