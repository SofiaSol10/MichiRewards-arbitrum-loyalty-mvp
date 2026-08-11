export type ChatRole = "user" | "model";

export type ChatMessage = { role: ChatRole; text: string };

export type ConsumerAiOfferContext = {
  id: string;
  merchantName: string;
  title: string;
  subtitle: string;
  costMP: number | null;
  levelRequired: number;
};

export type ConsumerAiTicketContext = {
  offerTitle: string;
  merchantName: string;
  costMP: number | null;
  status: "active" | "redeemed" | "expired";
};

export type ConsumerAiContext = {
  levelNumber: number;
  levelTitle: string;
  totalPointsEarned: number;
  balance: number;
  offers: ConsumerAiOfferContext[];
  recentRedemptions: ConsumerAiTicketContext[];
};

export type MerchantAiBenefitContext = {
  level: number;
  name: string;
  cost: number;
  stock: number;
  active: boolean;
};

export type MerchantAiContext = {
  levelNumber: number;
  levelTitle: string;
  experience: number;
  xpToNextLevel: number | null;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  benefits: MerchantAiBenefitContext[];
};

export type AiRecommendation = { offerId: string; reason: string };

export type AiTip = { title: string; body: string };
