import React from "react";

export type Config = {
  projectId: string;
};

const ConfigContext = React.createContext<Config | null>(null);

export function ConfigProvider({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const value = React.useMemo(() => ({ projectId }), [projectId]);
  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export function useConfig(): Config {
  const ctx = React.useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used inside ConfigProvider");
  return ctx;
}
