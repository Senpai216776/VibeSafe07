# 🚨 VibeSafe - ESP32-C3 SuperMini SOS Emergency Command Center

**VibeSafe** is a real-time, responsive emergency monitoring dashboard and secure backend designed for wearable safety devices powered by the **ESP32-C3 SuperMini**. The ESP32 communicates over Wi-Fi using encrypted REST API calls and persistent tokens, providing emergency distress telemetry, live GPS tracking, battery telemetry, and immediate audio-visual triage capabilities.

---

## 🌟 Key Features

- **🚨 Instant Visual & Audio SOS Alerts**: Prominent flashing banner with live elapsed timer, animated pulse rings, and synthesized Web Audio API emergency sirens (with instant mute toggle).
- **🗺️ Live Tactical GPS Radar Map**: OpenStreetMap (Leaflet) view with real-time radar pulsing markers for devices in distress, custom popup telemetry cards, and direct Google Maps navigation links.
- **📱 ESP32-C3 Device Fleet Management**: Register devices, automatically generate cryptographically secure hardware API keys (`vs_dev_...`), track battery percentage & voltage, and monitor Wi-Fi RSSI signals.
- **⚡ Built-in Hardware Simulator**: Interactive virtual ESP32-C3 board in the dashboard for testing live SOS button holds, periodic heartbeats, battery drain, and custom GPS coordinates with zero hardware setup.
- **📜 Incident History & Audit Logs**: Filterable timeline of historical emergency events, responder action notes, resolution classifications (Resolved vs False Alarm), and one-click CSV / JSON exports.
- **🛠️ Ready-to-Flash Arduino C++ Firmware**: Complete, documented `.ino` sketch configured for ESP32-C3 SuperMini with button debounce on GPIO 9, battery ADC on GPIO 0, and status LED on GPIO 8.
- **🔒 Privacy & Zero Public Exposure**: Protected endpoints, JWT authentication for dashboard operators, and device-key validation for IoT endpoints.

---

## 🚀 One-Click Hosting on Vercel

### Method 1: Deploy with Vercel CLI (Recommended)

1. Make sure you have the [Vercel CLI](https://vercel.com/cli) installed:
   ```bash
   npm i -g vercel
   ```

2. From the project root (`vibesafe` directory), run:
   ```bash
   vercel
   ```

3. Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? **Select your account**
   - Link to existing project? **No**
   - What's your project's name? **vibesafe**
   - In which directory is your code located? **./**

4. To deploy to production:
   ```bash
   vercel --prod
   ```

### Method 2: Deploy via GitHub + Vercel Dashboard

1. Push this directory to a GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Vercel will automatically detect `vercel.json` and build the client and serverless API functions.
4. Click **Deploy**!

---

## 💻 Local Development Setup

### 1. Install Dependencies
```bash
# Install root, client, and server dependencies
npm --prefix client install
npm --prefix server install
```

### 2. Start Full-Stack App
```bash
# Terminal 1: Start Express & WebSocket Backend (Port 3001)
npm run server

# Terminal 2: Start Vite Client (Port 5173)
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## 🔑 Default Demo Accounts

| Role | Email | Password |
|---|---|---|
| **Chief Commander (Admin)** | `admin@vibesafe.io` | `vibesafe123` |
| **Field First Responder** | `responder@vibesafe.io` | `responder123` |

*(You can also use the 1-click quick login buttons on the login screen or register a new custom account.)*

---

## 📡 ESP32-C3 SuperMini Hardware Connections

| Pin on ESP32-C3 | Hardware Component | Configuration | Description |
|---|---|---|---|
| **GPIO 9** | SOS Push Button | `INPUT_PULLUP` | Built-in Boot Button or external switch to GND. Hold 1.5s to trigger. |
| **GPIO 3** | Cancel Button | `INPUT_PULLUP` | Secondary button to cancel accidental alarms. |
| **GPIO 8** | Status LED | `OUTPUT` (Active LOW) | Onboard blue LED flashes during emergency. |
| **GPIO 2** | Haptic Buzzer | `OUTPUT` / PWM | Vibration motor feedback upon SOS confirmation. |
| **GPIO 0** | Battery ADC | `ADC1_CH0` | Connected to LiPo battery via 100k/100k voltage divider. |
| **GPIO 20 / 21** | GPS Module (NEO-6M) | UART Serial1 | Reads live latitude/longitude NMEA sentences. |

---

## 🧪 Running Automated Tests

```bash
npm test
```
Verifies health checks, authentication, device token validation, SOS ingestion, and incident triage workflows.
