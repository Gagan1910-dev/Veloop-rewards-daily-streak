import React from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { useAuth } from './hooks/useAuth.js';
import DailyStreakPage from './pages/DailyStreak/DailyStreakPage.jsx';
import AuthPage from './pages/Auth/AuthPage.jsx';
import StreakLoader from './components/StreakLoader/StreakLoader.jsx';

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <StreakLoader message="Connecting to VELoop Rewards..." />;
  }

  return isAuthenticated ? <DailyStreakPage /> : <AuthPage />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

