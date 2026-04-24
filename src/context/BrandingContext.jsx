import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const BrandingContext = createContext(null);

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState({
    branding_name: 'ZelpStore',
    branding_logo: null,
    branding_icon: null,
    enable_landing_page: true
  });
  const [loading, setLoading] = useState(true);

  const fetchBranding = () => {
    api.get('/settings/public')
      .then((data) => {
        setBranding({
          branding_name: data.branding_name || 'ZelpStore',
          branding_logo: data.branding_logo,
          branding_icon: data.branding_icon,
          enable_landing_page: data.enable_landing_page !== false
        });

        // Update favicon if icon exists
        if (data.branding_icon) {
          const favicon = document.getElementById('favicon');
          if (favicon) {
            favicon.href = data.branding_icon;
          }
        }

        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  // Update document title when branding name changes
  useEffect(() => {
    if (branding.branding_name) {
      // Check if current title contains the old branding name or is default
      // This is a simple implementation, you might want to use react-helmet for more complex scenarios
      document.title = `${branding.branding_name}`;
    }
  }, [branding.branding_name]);

  return (
    <BrandingContext.Provider value={{ ...branding, loading, refreshBranding: fetchBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error('useBranding must be inside BrandingProvider');
  return ctx;
}
