export type ThemeColor = "pink" | "yellow" | "cyan" | "purple";

export interface AppSettings {
  apiKey: string;
  theme: ThemeColor;
  hasInitialized: boolean;
}

export interface Message {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface ChatResponse {
  text?: string;
  functionCalls?: {
    name: string;
    args: any;
    id: string;
  }[];
}

export interface SystemStatus {
  battery: number;
  wifi: boolean;
  bluetooth: boolean;
  brightness: number;
  volume: number;
}

export interface AutomationLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  status: "success" | "pending" | "failed";
}
