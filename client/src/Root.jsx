import App from './App';
import { useAuth } from './auth';
import AuthPage from './views/AuthPage';

export default function Root() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="splash" role="status" aria-label="Loading">
        <span className="spinner big" />
      </div>
    );
  }
  return status === 'authed' ? <App /> : <AuthPage />;
}
