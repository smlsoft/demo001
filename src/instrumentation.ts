export async function register() {
  // ตั้ง Google DNS สำหรับ MongoDB Atlas SRV resolution บน Windows
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("dns");
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
  }
}
