import React from "react";

export type Config = {
  projectId: string;
  hintText?: string;
};

const ConfigContext = React.createContext<Config | null>(null);

export function ConfigProvider({
  projectId,
  hintText,
  children,
}: {
  projectId: string;
  hintText?: string;
  children: React.ReactNode;
}) {
  const value = React.useMemo(() => ({ projectId, hintText }), [projectId, hintText]);
  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export function useConfig(): Config {
  const ctx = React.useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used inside ConfigProvider");
  return ctx;
}
