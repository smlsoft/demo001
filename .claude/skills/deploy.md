# /deploy — Deploy ThaiClaw to DigitalOcean

## Steps (ทำตามลำดับนี้เสมอ)

```bash
# 1. Build ทดสอบก่อน deploy
npx next build

# 2. Commit + Push (ถ้ายังไม่ได้)
git add <files> && git commit -m "..." && git push origin main

# 3. SSH เข้า server + deploy
ssh root@157.230.45.53 "cd /opt/demo001 && git pull && cp .env.local .env && docker compose up -d --build thaiclaw"
```

## Checklist ห้ามลืม

- [ ] **`cp .env.local .env`** — Docker Compose อ่าน `.env` ไม่ใช่ `.env.local`
  - ถ้าลืม → MONGODB_URI ว่าง → เว็บ error "This page couldn't load"
- [ ] Service ชื่อ `thaiclaw` ไม่ใช่ `demo001-web`
- [ ] Container port = **3000** (ไม่ใช่ 3100)
- [ ] Caddy proxy: `demo001.satistang.com → 172.17.0.1:3000`

## Verify หลัง deploy

```bash
# ต้องได้ 200
ssh root@157.230.45.53 "curl -s -o /dev/null -w '%{http_code}' https://demo001.satistang.com/"

# เช็ค env ส่งเข้า container จริง
ssh root@157.230.45.53 "docker exec thaiclaw-web sh -c 'echo \$MONGODB_URI | head -c 20'"

# เช็ค logs
ssh root@157.230.45.53 "docker logs thaiclaw-web --tail 20"
```

## ปัญหาที่เคยเจอ

| ปัญหา | สาเหตุ | แก้ไข |
|-------|--------|-------|
| 502 Bad Gateway | Caddy ชี้ผิด port | แก้ Caddyfile: `reverse_proxy 172.17.0.1:3000` แล้ว restart caddy |
| "This page couldn't load" | MONGODB_URI ว่าง | `cp .env.local .env` แล้ว rebuild |
| "no such service" | ใช้ชื่อ container แทน service | ใช้ `thaiclaw` (service name ใน docker-compose) |
| Caddy reload ไม่ทำงาน | Caddyfile mount read-only | แก้ที่ host `/opt/openclawminicrm/Caddyfile` แล้ว `docker restart smltrack-caddy` |
| GitHub Actions deploy fail | SSH secrets ไม่ได้ตั้ง | ไม่ใช้ auto deploy — deploy manual ผ่าน SSH |

## Network Architecture

```
Browser → Caddy (port 443) → 172.17.0.1:3000 → thaiclaw-web container
           network: openclawminicrm_default     network: demo001_default
```

Caddy เข้าถึง thaiclaw ผ่าน Docker bridge gateway `172.17.0.1` (ไม่ใช่ internal network)
