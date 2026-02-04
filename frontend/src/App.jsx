/**
 * Main App Component
 * 
 * Sets up routing and provides the main application structure.
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import LandingPage from './pages/LandingPage';
import StashPage from './pages/StashPage';
import ProjectsPage from './pages/ProjectsPage';
import CalculatorPage from './pages/CalculatorPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/stash" element={<StashPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
