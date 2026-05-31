import { useState, useEffect, createContext, useContext } from 'react';
import { getAppConfig } from '../lib/cms';

const CMSContext = createContext({});

export function CMSProvider({ children }) {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAppConfig().then(cfg => {
      setConfig(cfg);
      setLoading(false);
    });
  }, []);

  return (
    <CMSContext.Provider value={{ config, loading, reload: () => getAppConfig(true).then(setConfig) }}>
      {children}
    </CMSContext.Provider>
  );
}

export function useCMS() {
  return useContext(CMSContext);
}
