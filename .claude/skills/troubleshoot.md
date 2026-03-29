# /troubleshoot — แก้ปัญหา ThaiClaw Server

## Quick Diagnosis (ทำทีละขั้น)

### 1. เว็บเปิดไม่ได้ / 502

```bash
# เช็ค container รันอยู่ไหม
ssh root@157.230.45.53 "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep thaic"

# เช็ค Caddy ชี้ถูก port ไหม (ต้องเป็น 3000)
ssh root@157.230.45.53 "cat /opt/openclawminicrm/Caddyfile | grep demo001 -A2"

# เช็คจาก Caddy container เข้าถึง app ได้ไหม
ssh root@157.230.45.53 "docker exec smltrack-caddy wget -q -O /dev/null -S http://172.17.0.1:3000/ 2>&1 | head -3"
```

### 2. เว็บเปิดได้แต่ "This page couldn't load" / Server Error

```bash
# 90% เป็นเรื่อง env vars → เช็ค MONGODB_URI
ssh root@157.230.45.53 "docker exec thaiclaw-web sh -c 'echo \$MONGODB_URI | wc -c'"
# ถ้าได้ 1 = ว่างเปล่า → cp .env.local .env แล้ว rebuild

# เช็ค app logs
ssh root@157.230.45.53 "docker logs thaiclaw-web --tail 30"
```

### 3. Telegram Bot ไม่ตอบ

```bash
# เช็คว่า webhook ตั้งถูกไหม
ssh root@157.230.45.53 "docker exec thaiclaw-web sh -c 'echo \$TELEGRAM_BOT_TOKEN | head -c 10'"

# เช็ค HiClaw/AI Gateway
ssh root@157.230.45.53 "curl -s http://localhost:18080/health 2>&1 | head -5"

# ดู error log
ssh root@157.230.45.53 "docker logs thaiclaw-web --tail 50 2>&1 | grep -i 'error\|fail\|timeout'"
```

### 4. รูป/Slip ไม่แสดง

```bash
# เช็ค R2 config
ssh root@157.230.45.53 "docker exec thaiclaw-web sh -c 'echo \$R2_ENDPOINT | head -c 30'"

# ทดสอบ API files
ssh root@157.230.45.53 "curl -s -o /dev/null -w '%{http_code}' https://demo001.satistang.com/api/files"
# 401 = ปกติ (ต้อง login), 500 = มีปัญหา
```

## Fix Recipes

### Fix: env vars หาย (ปัญหาที่เจอบ่อยที่สุด!)
```bash
ssh root@157.230.45.53 "cd /opt/demo001 && cp .env.local .env && docker compose up -d --build thaiclaw"
```

### Fix: Caddy ชี้ผิด port
```bash
ssh root@157.230.45.53 "sed -i 's/172.17.0.1:[0-9]*/172.17.0.1:3000/' /opt/openclawminicrm/Caddyfile && docker restart smltrack-caddy"
```

### Fix: Container ค้าง / ต้อง restart
```bash
ssh root@157.230.45.53 "cd /opt/demo001 && docker compose restart thaiclaw"
```

### Fix: Full rebuild (nuclear option)
```bash
ssh root@157.230.45.53 "cd /opt/demo001 && git pull && cp .env.local .env && docker compose down && docker compose up -d --build thaiclaw"
```

## กฎเหล็ก

1. **อย่าแก้ Caddyfile ใน container** — mount read-only → แก้ที่ host `/opt/openclawminicrm/Caddyfile`
2. **ทุกครั้งที่ rebuild** → ต้อง `cp .env.local .env` ก่อน
3. **ห้ามใช้ชื่อ container** เป็น service name — `thaiclaw` ≠ `thaiclaw-web`
4. **ThaiClaw กับ CRM คนละ project** — ห้ามปนเด็ดขาด (ดู project_separation.md)
5. **Verify ทุกครั้งหลัง deploy** — curl https://demo001.satistang.com/ ต้องได้ 200
