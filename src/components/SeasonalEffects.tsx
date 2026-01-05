import Snowfall from "react-snowfall";
import { useEffect, useState } from "react";

type SeasonalTheme =
  | "snow"      // Natal
  | null;

interface SeasonConfig {
  theme: SeasonalTheme;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  name: string;
}

// Configuração das datas para cada tema
const seasonConfigs: SeasonConfig[] = [
  // Natal (15 Dez - 30 Dez)
  { theme: "snow", startMonth: 12, startDay: 1, endMonth: 12, endDay: 30, name: "Natal" },
];

function isDateInRange(config: SeasonConfig): boolean {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  // Cria datas para comparação
  const current = currentMonth * 100 + currentDay;
  const start = config.startMonth * 100 + config.startDay;
  const end = config.endMonth * 100 + config.endDay;

  return current >= start && current <= end;
}

function getCurrentTheme(): { theme: SeasonalTheme; name: string } | null {
  for (const config of seasonConfigs) {
    if (isDateInRange(config)) {
      return { theme: config.theme, name: config.name };
    }
  }
  return null;
}

export function SeasonalEffects() {
  const [currentSeason, setCurrentSeason] = useState<{ theme: SeasonalTheme; name: string } | null>(null);

  useEffect(() => {
    setCurrentSeason(getCurrentTheme());
  }, []);

  if (!currentSeason) return null;

  switch (currentSeason.theme) {
    case "snow":
      return (
        <Snowfall
          color="#82c3d9"
        />
      );
    default:
      return null;
  }
}

// Exporta função para obter tema atual (útil para debug ou exibição)
export { getCurrentTheme, seasonConfigs };
