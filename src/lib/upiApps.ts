export interface UpiAppInfo {
  id: string;
  name: string;
  shortName: string;
  category: "popular" | "bank" | "wallet" | "other";
  color: string;
  bgColor: string;
  borderColor: string;
  iconName?: string;
  isPopular?: boolean;
}

export const ALL_UPI_APPS: UpiAppInfo[] = [
  {
    id: "default",
    name: "System Default / Any UPI App",
    shortName: "Any UPI App",
    category: "popular",
    color: "#0ea5e9",
    bgColor: "rgba(14, 165, 233, 0.12)",
    borderColor: "rgba(14, 165, 233, 0.3)",
    isPopular: true,
  },
  {
    id: "gpay",
    name: "Google Pay (GPay)",
    shortName: "Google Pay",
    category: "popular",
    color: "#4285F4",
    bgColor: "rgba(66, 133, 244, 0.12)",
    borderColor: "rgba(66, 133, 244, 0.3)",
    isPopular: true,
  },
  {
    id: "phonepe",
    name: "PhonePe",
    shortName: "PhonePe",
    category: "popular",
    color: "#5f259f",
    bgColor: "rgba(95, 37, 159, 0.12)",
    borderColor: "rgba(95, 37, 159, 0.3)",
    isPopular: true,
  },
  {
    id: "paytm",
    name: "Paytm",
    shortName: "Paytm",
    category: "popular",
    color: "#00b9f1",
    bgColor: "rgba(0, 185, 241, 0.12)",
    borderColor: "rgba(0, 185, 241, 0.3)",
    isPopular: true,
  },
  {
    id: "amazonpay",
    name: "Amazon Pay",
    shortName: "Amazon Pay",
    category: "popular",
    color: "#FF9900",
    bgColor: "rgba(255, 153, 0, 0.12)",
    borderColor: "rgba(255, 153, 0, 0.3)",
    isPopular: true,
  },
  {
    id: "cred",
    name: "CRED UPI",
    shortName: "CRED",
    category: "popular",
    color: "#1e1e1e",
    bgColor: "rgba(30, 30, 30, 0.12)",
    borderColor: "rgba(30, 30, 30, 0.3)",
    isPopular: true,
  },
  {
    id: "bhim",
    name: "BHIM UPI",
    shortName: "BHIM",
    category: "popular",
    color: "#00833e",
    bgColor: "rgba(0, 131, 62, 0.12)",
    borderColor: "rgba(0, 131, 62, 0.3)",
    isPopular: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp Pay",
    shortName: "WhatsApp",
    category: "popular",
    color: "#25D366",
    bgColor: "rgba(37, 211, 102, 0.12)",
    borderColor: "rgba(37, 211, 102, 0.3)",
    isPopular: true,
  },
  {
    id: "payzapp",
    name: "PayZapp (HDFC)",
    shortName: "PayZapp",
    category: "bank",
    color: "#004c8f",
    bgColor: "rgba(0, 76, 143, 0.12)",
    borderColor: "rgba(0, 76, 143, 0.3)",
  },
  {
    id: "imobile",
    name: "iMobile Pay (ICICI)",
    shortName: "iMobile",
    category: "bank",
    color: "#f37e20",
    bgColor: "rgba(243, 126, 32, 0.12)",
    borderColor: "rgba(243, 126, 32, 0.3)",
  },
  {
    id: "mobikwik",
    name: "MobiKwik",
    shortName: "MobiKwik",
    category: "wallet",
    color: "#239cd6",
    bgColor: "rgba(35, 156, 214, 0.12)",
    borderColor: "rgba(35, 156, 214, 0.3)",
  },
  {
    id: "navi",
    name: "Navi UPI",
    shortName: "Navi",
    category: "other",
    color: "#00c389",
    bgColor: "rgba(0, 195, 137, 0.12)",
    borderColor: "rgba(0, 195, 137, 0.3)",
  },
  {
    id: "supermoney",
    name: "super.money (Flipkart)",
    shortName: "super.money",
    category: "other",
    color: "#f53838",
    bgColor: "rgba(245, 56, 56, 0.12)",
    borderColor: "rgba(245, 56, 56, 0.3)",
  },
  {
    id: "sbiyono",
    name: "YONO SBI",
    shortName: "YONO SBI",
    category: "bank",
    color: "#280071",
    bgColor: "rgba(40, 0, 113, 0.12)",
    borderColor: "rgba(40, 0, 113, 0.3)",
  },
];

export const DEFAULT_ACTIVE_APP_IDS = ["default", "gpay", "phonepe", "paytm", "amazonpay", "bhim", "cred"];

export interface UpiParams {
  pa: string; // payee address (VPA)
  pn?: string; // payee name
  am?: string | number; // amount
  cu?: string; // currency
  tn?: string; // transaction note
  tr?: string; // transaction ref
  mc?: string; // merchant code
}

/**
 * Builds the appropriate deep-link / URI scheme for a selected UPI app
 */
export function buildUpiDeepLink(appId: string, params: UpiParams): string {
  const urlParams = new URLSearchParams();
  if (params.pa) urlParams.append("pa", params.pa);
  if (params.pn) urlParams.append("pn", params.pn);
  if (params.am !== undefined && params.am !== null && params.am !== "") {
    urlParams.append("am", params.am.toString());
  }
  urlParams.append("cu", params.cu || "INR");
  if (params.tn) urlParams.append("tn", params.tn);
  if (params.tr) urlParams.append("tr", params.tr);
  if (params.mc) urlParams.append("mc", params.mc);

  const query = urlParams.toString();

  switch (appId) {
    case "gpay":
      // GPay handles tez:// and gpay://
      return `gpay://upi/pay?${query}`;
    case "phonepe":
      return `phonepe://pay?${query}`;
    case "paytm":
      return `paytmmp://pay?${query}`;
    case "amazonpay":
      return `amazonpay://upi/pay?${query}`;
    case "cred":
      return `cred://pay?${query}`;
    case "bhim":
      return `bhim://pay?${query}`;
    case "whatsapp":
      return `whatsapp://pay?${query}`;
    case "payzapp":
      return `payzapp://upi/pay?${query}`;
    case "imobile":
      return `imobile://pay?${query}`;
    case "mobikwik":
      return `mobikwik://pay?${query}`;
    case "navi":
      return `navi://pay?${query}`;
    case "supermoney":
      return `supermoney://pay?${query}`;
    case "sbiyono":
      return `yonosbi://pay?${query}`;
    case "default":
    default:
      return `upi://pay?${query}`;
  }
}
