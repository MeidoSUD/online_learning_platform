import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { appConfigService, AppConfigSettings } from '../Services/api';

interface AppConfigContextType {
  appConfig: AppConfigSettings | null;
  isPackageEnabled: boolean;
  loading: boolean;
  refreshConfig: () => Promise<void>;
}

const AppConfigContext = createContext<AppConfigContextType>({
  appConfig: null,
  isPackageEnabled: false,
  loading: true,
  refreshConfig: async () => {},
});

export const AppConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appConfig, setAppConfig] = useState<AppConfigSettings | null>(null);
  const [isPackageEnabled, setIsPackageEnabled] = useState<boolean>(() => {
    try {
      const cached = localStorage.getItem('package_enable');
      if (cached !== null) {
        return cached === 'true' || cached === '1';
      }
    } catch {}
    return false;
  });
  const [loading, setLoading] = useState<boolean>(true);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await appConfigService.getPublicAppConfig();
      if (data) {
        setAppConfig(data);
        const rawPackage = data.package_enable;
        const enabled =
          rawPackage === true ||
          rawPackage === 1 ||
          rawPackage === '1' ||
          rawPackage === 'true';
        setIsPackageEnabled(Boolean(enabled));
        try {
          localStorage.setItem('package_enable', String(Boolean(enabled)));
        } catch {}
      }
    } catch {
      setIsPackageEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const value = {
    appConfig,
    isPackageEnabled,
    loading,
    refreshConfig: fetchConfig,
  };

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error('useAppConfig must be used within an AppConfigProvider');
  }
  return context;
};
