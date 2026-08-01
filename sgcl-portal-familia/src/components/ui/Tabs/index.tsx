import { useState, type ReactNode } from "react";

import "./styles.css";

interface TabItem {
  label: ReactNode;
  value: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultValue?: string;
  // modo controlado (opcional) — quando informados, quem decide a aba
  // ativa é o pai (ex.: um botão "Ver planejamento" numa aba que muda pra
  // outra). Sem eles, o componente continua gerenciando o estado sozinho.
  value?: string;
  onChange?: (value: string) => void;
}

export function Tabs({
  tabs,
  defaultValue,
  value,
  onChange,
}: TabsProps) {
  const [activeTabInterno, setActiveTabInterno] = useState(
    defaultValue ?? tabs[0]?.value
  );

  const activeTab = value ?? activeTabInterno;

  function selecionar(novoValor: string) {
    if (onChange) {
      onChange(novoValor);
    } else {
      setActiveTabInterno(novoValor);
    }
  }

  const selectedTab = tabs.find(
    (tab) => tab.value === activeTab
  );

  return (
    <div className="tabs">
      <div className="tabs-list">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={
              tab.value === activeTab
                ? "tabs-trigger active"
                : "tabs-trigger"
            }
            onClick={() => selecionar(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tabs-content" key={activeTab}>
        {selectedTab?.content}
      </div>
    </div>
  );
}