
export type ThemeType = 'blue' | 'green' | 'red' | 'purple' | 'teal' | 'orange' | 'indigo' | 'rose' | 'amber' | 'cyan';

export interface User {
  id: string;
  name: string;
  password: string;
  age?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  mobile?: string;
  photo?: string;
  isBlocked: boolean;
  theme: ThemeType;
}

export interface Medicine {
  id: string;
  brandName: string;
  genericName: string;
  company: string;
  price: string;
  description?: string;
}

export interface OrderItem {
  medicineName: string;
  quantity: string;
  pricePerUnit: string;
}

export interface Prescription {
  id: string;
  userId: string;
  date: string;
  patientName: string;
  age: string;
  gender: string;
  bp?: string;
  diabetes?: string;
  symptoms: string[];
  diagnosis: string;
  medicines: {
    nameEn: string;
    nameBn: string;
    generic: string;
    dosage: string;
    purpose: string;
  }[];
  advice: string;
  precautions?: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  totalPrice: number;
  address: string;
  phone: string;
  note: string;
  status: 'pending' | 'replied' | 'confirmed';
  adminReply?: string;
  timestamp: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
}

export interface AppNotification {
  id: string;
  to: 'admin' | string; // userId
  message: string;
  timestamp: number;
  read: boolean;
}

export interface AppConfig {
  homeHeader: string;
  homeFooter: string;
  prescriptionHeader: string;
  prescriptionFooter: string;
  prescriptionTheme: ThemeType;
  bannerImage: string;
  welcomeBanner: {
    title: string;
    image: string;
  };
  digitalSignature: string;
  doctorDetails: {
    name: string;
    degree: string;
    specialty: string;
    regNo: string;
  };
}
