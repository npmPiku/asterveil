import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { WalletProvider } from './contexts/WalletContext';
import { ThemeProvider } from './contexts/ThemeContext';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProvePage from './pages/ProvePage';
import RegistryPage from './pages/RegistryPage';
import AdminPage from './pages/AdminPage';
import DocsPage from './pages/DocsPage';

function RouteFocus() {
  const location = useLocation();
  useEffect(() => {
    document.getElementById('main-content')?.focus();
  }, [location.pathname]);
  return null;
}

function AppShell() {
  return (
    <div className="app-shell">
      <RouteFocus />
      <NavBar />
      <main id="main-content" className="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/prove" element={<ProvePage />} />
          <Route path="/registry" element={<RegistryPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </WalletProvider>
    </ThemeProvider>
  );
}
