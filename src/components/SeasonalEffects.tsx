import Snowfall from "react-snowfall";
import { useEffect, useState } from "react";

type SeasonalTheme = 
  | "snow"      // Natal
  | "hearts"    // Dia dos Namorados
  | "confetti"  // Carnaval
  | "fireworks" // Ano Novo
  | "leaves"    // Outono
  | "flowers"   // Primavera
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
  // Ano Novo (31 Dez - 2 Jan)
  { theme: "fireworks", startMonth: 12, startDay: 31, endMonth: 12, endDay: 31, name: "Ano Novo" },
  { theme: "fireworks", startMonth: 1, startDay: 1, endMonth: 1, endDay: 2, name: "Ano Novo" },
  
  // Carnaval (período aproximado - Fevereiro)
  { theme: "confetti", startMonth: 2, startDay: 10, endMonth: 2, endDay: 25, name: "Carnaval" },
  
  // Dia dos Namorados Brasil (12 de Junho)
  { theme: "hearts", startMonth: 6, startDay: 10, endMonth: 6, endDay: 14, name: "Dia dos Namorados" },
  
  // Primavera (Set-Nov no Brasil)
  { theme: "flowers", startMonth: 9, startDay: 22, endMonth: 11, endDay: 21, name: "Primavera" },
  
  // Outono (Mar-Jun no Brasil)
  { theme: "leaves", startMonth: 3, startDay: 20, endMonth: 5, endDay: 20, name: "Outono" },
  
  // Natal (15 Dez - 30 Dez)
  { theme: "snow", startMonth: 12, startDay: 15, endMonth: 12, endDay: 30, name: "Natal" },
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

// Componente de Corações
function HeartsEffect() {
  const [hearts, setHearts] = useState<{ id: number; left: number; delay: number; size: number }[]>([]);

  useEffect(() => {
    const newHearts = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      size: Math.random() * 20 + 10,
    }));
    setHearts(newHearts);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute animate-fall-heart text-pink-500"
          style={{
            left: `${heart.left}%`,
            animationDelay: `${heart.delay}s`,
            fontSize: `${heart.size}px`,
          }}
        >
          ❤️
        </div>
      ))}
    </div>
  );
}

// Componente de Confete
function ConfettiEffect() {
  const [confetti, setConfetti] = useState<{ id: number; left: number; delay: number; color: string; rotation: number }[]>([]);

  useEffect(() => {
    const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ff8800", "#8800ff"];
    const newConfetti = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
    }));
    setConfetti(newConfetti);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 animate-fall-confetti"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// Componente de Fogos de Artifício
function FireworksEffect() {
  const [sparks, setSparks] = useState<{ id: number; left: number; top: number; delay: number }[]>([]);

  useEffect(() => {
    const newSparks = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 60 + 10,
      delay: Math.random() * 3,
    }));
    setSparks(newSparks);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {sparks.map((spark) => (
        <div
          key={spark.id}
          className="absolute animate-firework"
          style={{
            left: `${spark.left}%`,
            top: `${spark.top}%`,
            animationDelay: `${spark.delay}s`,
          }}
        >
          ✨
        </div>
      ))}
    </div>
  );
}

// Componente de Folhas
function LeavesEffect() {
  const [leaves, setLeaves] = useState<{ id: number; left: number; delay: number; emoji: string }[]>([]);

  useEffect(() => {
    const leafEmojis = ["🍂", "🍁", "🍃"];
    const newLeaves = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 6,
      emoji: leafEmojis[Math.floor(Math.random() * leafEmojis.length)],
    }));
    setLeaves(newLeaves);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute text-2xl animate-fall-leaf"
          style={{
            left: `${leaf.left}%`,
            animationDelay: `${leaf.delay}s`,
          }}
        >
          {leaf.emoji}
        </div>
      ))}
    </div>
  );
}

// Componente de Flores
function FlowersEffect() {
  const [petals, setPetals] = useState<{ id: number; left: number; delay: number; emoji: string }[]>([]);

  useEffect(() => {
    const flowerEmojis = ["🌸", "🌺", "🌷", "💮", "🏵️"];
    const newPetals = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 7,
      emoji: flowerEmojis[Math.floor(Math.random() * flowerEmojis.length)],
    }));
    setPetals(newPetals);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="absolute text-xl animate-fall-flower"
          style={{
            left: `${petal.left}%`,
            animationDelay: `${petal.delay}s`,
          }}
        >
          {petal.emoji}
        </div>
      ))}
    </div>
  );
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
          color="#fff"
          snowflakeCount={150}
          style={{
            position: 'fixed',
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
      );
    case "hearts":
      return <HeartsEffect />;
    case "confetti":
      return <ConfettiEffect />;
    case "fireworks":
      return <FireworksEffect />;
    case "leaves":
      return <LeavesEffect />;
    case "flowers":
      return <FlowersEffect />;
    default:
      return null;
  }
}

// Exporta função para obter tema atual (útil para debug ou exibição)
export { getCurrentTheme, seasonConfigs };
