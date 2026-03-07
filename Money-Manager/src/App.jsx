import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { supabase } from './services/supabaseClient';
import Navigation from './components/Navigation/Navigation';
import Home from './components/Home/Home';
import Calendar from './components/Calendar/Calendar';
import Analytics from './components/Analytics/Analytics';
import Transactions from './components/Transactions/Transactions';
import Settings from './components/Settings/Settings';
import Auth from './components/Auth/Auth';
import Subscription from './components/Subscription/Subscription';

// Import component styles
import './components/Home/Home.css';
import './components/Calendar/Calendar.css';
import './components/Analytics/Analytics.css';
import './components/Transactions/Transactions.css';
import './components/Settings/Settings.css';

function AppContent() {
  const { activeTab, settings } = useApp();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setCheckingAuth(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Apply theme to document body (keep hook order stable)
  useEffect(() => {
    const theme = settings?.theme || 'dark';
    document.body.setAttribute('data-theme', theme);
  }, [settings?.theme]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  if (checkingAuth) {
    return null;
  }

  if (!isAuthenticated) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'calendar':
        return <Calendar />;
      case 'analytics':
        return <Analytics />;
      case 'transactions':
        return <Transactions />;
      case 'settings':
        return <Settings />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="app-container">
      <main className="main-content">
        {renderTab()}
      </main>
      <Navigation />

      {/* Global Subscription Check Overlay */}
      <Subscription />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
