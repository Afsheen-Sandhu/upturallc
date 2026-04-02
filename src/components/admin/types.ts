export type OrderStatus = "pending" | "approved" | "rejected";

export type OrderRecord = {
  id: string;
  createdAt: Date | null;
  name: string;
  email: string;
  phone?: string;
  category?: string;
  planLabel?: string;
  price?: string;
  addons?: Array<{ title?: string }>;
  appointmentDate?: string;
  appointmentTime?: string;
  status: OrderStatus;
  remarks?: string;
};

export type LeadStatus = "pending" | "approved" | "rejected";

export type LeadRecord = {
  id: string;
  createdAt: Date | null;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  status: LeadStatus;
  remarks?: string;
};

