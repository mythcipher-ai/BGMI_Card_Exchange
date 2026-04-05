import type { CardData } from "@/components/CardItem";

export const mockCards: CardData[] = [
  {
    id: "1", name: "AWM Glacier", image: "https://placehold.co/400x300/1e293b/94a3b8?text=AWM+Glacier",
    offering: "AWM Glacier", lookingFor: ["M416 Fool's Gold", "Kar98k"], trustScore: 92,
    username: "SniperX", code: "BGMI-AWM-7K3L9", createdAt: "2026-04-04",
  },
  {
    id: "2", name: "M416 Fool's Gold", image: "https://placehold.co/400x300/1e293b/94a3b8?text=M416+Gold",
    offering: "M416 Fool's Gold", lookingFor: ["AKM Predator"], trustScore: 78,
    username: "GoldRush", code: "BGMI-M41-X9P2Q", createdAt: "2026-04-03",
  },
  {
    id: "3", name: "DP-28 Beekeeper", image: "https://placehold.co/400x300/1e293b/94a3b8?text=DP28+Bee",
    offering: "DP-28 Beekeeper", lookingFor: ["UZI Wilderness", "Pan Skin"], trustScore: 45,
    username: "BuzzyBee", code: "BGMI-DP2-H4M7N", createdAt: "2026-04-02",
  },
  {
    id: "4", name: "Kar98k Upgradable", image: "https://placehold.co/400x300/1e293b/94a3b8?text=Kar98k",
    offering: "Kar98k Upgradable", lookingFor: ["AWM Glacier", "M24 Skin"], trustScore: 88,
    username: "HeadshotKing", code: "BGMI-KAR-B2C5D", createdAt: "2026-04-01",
  },
  {
    id: "5", name: "UZI Wilderness", image: "https://placehold.co/400x300/1e293b/94a3b8?text=UZI+Wild",
    offering: "UZI Wilderness", lookingFor: ["Groza Skin"], trustScore: 65,
    username: "WildFire", code: "BGMI-UZI-Q8R3T", createdAt: "2026-03-30",
  },
  {
    id: "6", name: "AKM Predator", image: "https://placehold.co/400x300/1e293b/94a3b8?text=AKM+Pred",
    offering: "AKM Predator", lookingFor: ["M416 Fool's Gold", "AWM Glacier"], trustScore: 71,
    username: "PredatorZ", code: "BGMI-AKM-W5X1Y", createdAt: "2026-03-29",
  },
];
