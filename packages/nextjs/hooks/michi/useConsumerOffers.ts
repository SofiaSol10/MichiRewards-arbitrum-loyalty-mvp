import { useMemo } from "react";
import { useConsumerPetLevel } from "./useConsumerPetLevel";

export type OfferCategory = "cafeteria" | "restaurante" | "servicio" | "tienda";

export type Offer = {
  id: string;
  merchantName: string;
  category: OfferCategory;
  icon: "coffee" | "utensils" | "sparkles" | "store";
  title: string;
  subtitle: string;
  badge: string;
  costMP: number | null;
  levelRequired: number;
  cta: string;
  /** Shown in the Home dashboard's "Michi IA" recommendations row. */
  homePick?: boolean;
  /** Shown in the Michi Beneficios catalog's "Michi IA" selection row. */
  aiPick?: boolean;
};

/**
 * There is no on-chain or aggregated backend catalog of merchant offers yet
 * (merchant benefits live per-merchant in localStorage). This is a
 * frontend-only mock so the consumer catalog/recommendation screens have
 * representative data to render, structured to be swapped for a real
 * catalog source later.
 */
export const MOCK_OFFERS: Offer[] = [
  {
    id: "cafe-central",
    merchantName: "Café Central",
    category: "cafeteria",
    icon: "coffee",
    title: "15% Cashback en tu próxima compra",
    subtitle: "A 2 cuadras de ti",
    badge: "15% Cashback",
    costMP: null,
    levelRequired: 1,
    cta: "Activar Cupón",
    homePick: true,
  },
  {
    id: "ecomarket-san-juan",
    merchantName: "EcoMarket San Juan",
    category: "tienda",
    icon: "store",
    title: "Paga con Michis en toda la tienda",
    subtitle: "Basado en tus compras",
    badge: "Paga con Michis",
    costMP: null,
    levelRequired: 1,
    cta: "Ver Catálogo",
    homePick: true,
  },
  {
    id: "estudio-beauty",
    merchantName: "Estudio Beauty",
    category: "servicio",
    icon: "sparkles",
    title: "2x1 en tu primer servicio",
    subtitle: "Nuevo en la red",
    badge: "2x1 con Michis",
    costMP: null,
    levelRequired: 1,
    cta: "Reclamar Oferta",
    homePick: true,
  },
  {
    id: "el-gato-barista",
    merchantName: "El Gato Barista",
    category: "cafeteria",
    icon: "coffee",
    title: "Combo Desayuno: Cappuccino + Croissant artesanal",
    subtitle: "4.8 ★ · Precio especial",
    badge: "4.8",
    costMP: 25,
    levelRequired: 1,
    cta: "Canjear ahora",
  },
  {
    id: "zen-spa",
    merchantName: "Zen Spa & Relax",
    category: "servicio",
    icon: "sparkles",
    title: "Recibe 15% de retorno en MichiPoints en masajes relajantes.",
    subtitle: "Al pagar con: Wallet",
    badge: "15% Cashback",
    costMP: null,
    levelRequired: 1,
    cta: "Activar Cupón",
  },
  {
    id: "ecostore-local",
    merchantName: "EcoStore Local",
    category: "tienda",
    icon: "store",
    title: "Paga cualquiera de nuestros productos ecológicos con tus Michis.",
    subtitle: "Aceptan: Pagos 100% MP",
    badge: "100% MP",
    costMP: null,
    levelRequired: 1,
    cta: "Ver Catálogo",
  },
  {
    id: "trattoria-del-michi",
    merchantName: "La Trattoria del Michi",
    category: "restaurante",
    icon: "utensils",
    title: "Encontramos este lugar basado en tus compras en Café Central",
    subtitle: "A 1.2 km",
    badge: "Paga con Michis",
    costMP: 150,
    levelRequired: 3,
    cta: "Canjear ahora",
    aiPick: true,
  },
  {
    id: "sweet-pastry-club",
    merchantName: "Sweet Pastry Club",
    category: "restaurante",
    icon: "utensils",
    title: "20% de cashback en toda la repostería",
    subtitle: "Termina en 2 hrs",
    badge: "20% Cashback",
    costMP: null,
    levelRequired: 1,
    cta: "Activar Cupón",
    aiPick: true,
  },
];

export const CATEGORY_LABELS: Record<"todos" | OfferCategory, string> = {
  todos: "Todos",
  cafeteria: "Cafeterías",
  restaurante: "Restaurantes",
  servicio: "Servicios",
  tienda: "Tiendas",
};

export function useConsumerOffers(balance: number, category: "todos" | OfferCategory = "todos") {
  const { currentLevel } = useConsumerPetLevel(balance);

  const offers = useMemo(() => MOCK_OFFERS.filter(o => category === "todos" || o.category === category), [category]);

  const isUnlocked = (offer: Offer) => currentLevel.level >= offer.levelRequired;

  return { offers, isUnlocked, currentLevel };
}
