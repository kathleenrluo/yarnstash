/**
 * Main App Component
 * 
 * Sets up routing and provides the main application structure.
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import DemoBanner from './components/common/DemoBanner';
import FeedbackButton from './components/common/FeedbackButton';
import LandingPage from './pages/LandingPage';
import StashPage from './pages/StashPage';
import ProjectsPage from './pages/ProjectsPage';
import CalculatorPage from './pages/CalculatorPage';
import GalleryPage from './pages/GalleryPage';
import './App.css';

// Component to update document title based on route
function DocumentTitle() {
  const location = useLocation();

  useEffect(() => {
    const baseTitle = "Kat's Yarn Box";
    let pageTitle = baseTitle;

    switch (location.pathname) {
      case '/':
        pageTitle = `${baseTitle} - Home`;
        break;
      case '/stash':
        pageTitle = `${baseTitle} - Stash`;
        break;
      case '/projects':
        pageTitle = `${baseTitle} - Projects`;
        break;
      case '/calculator':
        pageTitle = `${baseTitle} - Calculator`;
        break;
      case '/gallery':
      case '/gallery/stash':
      case '/gallery/projects':
        pageTitle = `${baseTitle} - Kat's Gallery`;
        break;
      default:
        pageTitle = baseTitle;
    }

    document.title = pageTitle;
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <DocumentTitle />
          <DemoBanner />
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/stash" element={<StashPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/gallery/*" element={<GalleryPage />} />
          </Routes>
          <FeedbackButton />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
