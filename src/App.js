import React from 'react';
// Import routing components
import { Routes, Route } from 'react-router-dom';
// Import your new page components (which we will create next)
import LoginPage from './Login';
import DashboardPage from './Dashboard';

function App() {
  return (
    <Routes>
      {/* Route for the Login Page */}
      <Route path="/" element={<LoginPage />} />
      
      {/* Route for the Dashboard Page */}
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}

export default App;