// landing-web/src/App.jsx (do not remove this comment)
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ============================================
// PUBLIC PAGES
// ============================================
import NotFoundPage from "./components/common/NotFoundPage.jsx";
import ErrorPage from "./pages/error/ErrorPage.jsx";
import TermsPage from "./pages/common/TermsPage.jsx";
import PrivacyPage from "./pages/common/PrivacyPage.jsx";
import RefundPolicy from "./pages/common/RefundPolicy.jsx";
import DeliveryPolicy from "./pages/common/DeliveryPolicy.jsx";
import CancellationPolicy from "./pages/common/CancellationPolicy.jsx";
import MaintenancePage from "./pages/maintenance/MaintenancePage.jsx";
import DeveloperStamp from './components/common/DeveloperStamp';

// ============================================
// LANDING PAGES
// ============================================
import Home from "./pages/landingPages/home/Home.jsx";
import About from "./pages/landingPages/about/About.jsx";
import Contact from "./pages/landingPages/contact/Contact.jsx";
import Services from "./pages/landingPages/Services/Services.jsx";
import ScrollToTop from "./pages/landingPages/component/ScrollToTop.jsx";

// ADDED
import SitemapPage from "./components/common/SitemapPage.jsx";

import "./index.css";

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* LANDING PAGES */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/Services" element={<Services />} />

        {/* LEGAL PAGES */}
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/delivery-policy" element={<DeliveryPolicy />} />
        <Route path="/cancellation-policy" element={<CancellationPolicy />} />

        {/* ADDED: Sitemap */}
        <Route path="/sitemap" element={<SitemapPage />} />

        {/* SYSTEM PAGES */}
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="/yzo-dev" element={<DeveloperStamp />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App;