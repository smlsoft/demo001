import mongoose from "mongoose";
import dns from "dns";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/thaiclaw";

// ตั้ง Google DNS ทันทีที่ import module
try { dns.setServers(["8.8.8.8", "8.8.4.4"]); } catch {}

let cached = (global as any).mongoose;
if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDb() {
  // ตั้ง DNS ทุกครั้งเผื่อ Turbopack reset
  try { dns.setServers(["8.8.8.8", "8.8.4.4"]); } catch {}

  if (cached.conn) {
    // ตรวจว่า connection ยังใช้ได้
    if (mongoose.connection.readyState === 1) return cached.conn;
    // connection หลุด reset
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 10000,
        maxPoolSize: 20,          // รองรับ concurrent connections มากขึ้น (default 10)
        minPoolSize: 5,           // เก็บ connection พร้อมใช้เสมอ
        maxIdleTimeMS: 30000,     // ปิด idle connections หลัง 30s
        compressors: ["zstd", "snappy"], // บีบอัดข้อมูลระหว่าง app-db
      })
      .then((m) => m)
      .catch((err: any) => {
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
