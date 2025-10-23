// src/data/bus97.ts
// ไม่พึ่ง import JSON แบบ ESModule เพื่อตัดปัญหา resolveJsonModule
// ใช้ require() แล้ว cast เป็น Stop[] ที่นี่ "ที่เดียว"

export interface Stop {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

// require เป็น unknown ก่อน แล้วค่อย cast ชัดเจน
const raw: unknown = require('./Bus_510.json');

export const STOPS: Stop[] = raw as Stop[];

export const OUTBOUND_LAST_ID = 135; // id 1-59 = ขาออก
export const INBOUND_LAST_ID = 136; // id 60-120 = ขาเข้า
