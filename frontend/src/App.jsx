import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
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

