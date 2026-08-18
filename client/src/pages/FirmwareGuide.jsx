import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Cpu,
  Terminal,
  Zap,
  Radio,
  Layers,
  BookOpen,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export const FirmwareGuide = () => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const sampleFirmwareCode = `/*
 ==============================================================================
  VibeSafe - ESP32-C3 SuperMini SOS Emergency Wearable Firmware
 ==============================================================================
  Target Board: ESP32-C3 SuperMini
  Core: ESP32 Arduino Core v2.0.x / v3.x
  Required Libraries: WiFi, HTTPClient, ArduinoJson (v6 or v7)
 ==============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// 1. CONFIGURATION
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Server Host (Vercel deployment or Local IP)
const char* SERVER_URL    = "https://your-vibesafe-deployment.vercel.app";

// Device Credentials (Generated from VibeSafe Dashboard -> Devices)
const char* DEVICE_ID     = "VS-ESP32-C3-01";
const char* DEVICE_API_KEY = "vs_dev_9f83a84b02e77b194d4a89c0";

// 2. HARDWARE PIN DEFINITIONS (ESP32-C3 SuperMini)
#define PIN_BUTTON_SOS    9   // Boot button or external push switch (Active LOW)
#define PIN_BUTTON_CANCEL 3   // Secondary button (Active LOW)
#define PIN_LED_STATUS    8   // Onboard LED on SuperMini (Active LOW)
#define PIN_HAPTIC_BUZZER 2   // Buzzer or vibration motor
#define PIN_BATTERY_ADC   0   // Voltage divider (ADC1_CH0)

const unsigned long SOS_HOLD_TIME_MS      = 1500;  // 1.5s button hold to prevent misfires
const unsigned long HEARTBEAT_INTERVAL_MS = 60000; // 60s periodic ping

unsigned long lastHeartbeatTime = 0;
unsigned long buttonPressStartTime = 0;
bool isButtonPressed = false;
bool isEmergencyActive = false;

// Default/Simulated coordinates if GPS is not connected
float currentLat = 37.7749;
float currentLng = -122.4194;

void setLed(bool on) {
  // SuperMini LED is inverted: LOW = ON
  digitalWrite(PIN_LED_STATUS, on ? LOW : HIGH);
}

void triggerHaptic(int count, int durMs) {
  for (int i = 0; i < count; i++) {
    digitalWrite(PIN_HAPTIC_BUZZER, HIGH);
    setLed(true);
    delay(durMs);
    digitalWrite(PIN_HAPTIC_BUZZER, LOW);
    setLed(false);
    if (i < count - 1) delay(durMs);
  }
}

float readBatteryVoltage() {
  int raw = analogRead(PIN_BATTERY_ADC);
  float pinVoltage = (raw / 4095.0) * 3.3;
  return pinVoltage * 2.0; // 1:1 voltage divider
}

int calculateBatteryPercent(float voltage) {
  if (voltage >= 4.20) return 100;
  if (voltage <= 3.30) return 0;
  return (int)((voltage - 3.30) / (4.20 - 3.30) * 100.0);
}

void connectWiFi() {
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 20) {
    delay(500);
    Serial.print(".");
    setLed(tries % 2 == 0);
    tries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
    setLed(false);
  }
}

bool sendSosAlert() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  String url = String(SERVER_URL) + "/api/v1/devices/sos";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_API_KEY);

  float voltage = readBatteryVoltage();
  int pct = calculateBatteryPercent(voltage);

  StaticJsonDocument<512> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["batteryLevel"] = pct;
  doc["voltage"] = serialized(String(voltage, 2));
  doc["wifiSignal"] = WiFi.RSSI();
  doc["triggerType"] = "hardware_button_sos";

  JsonObject gps = doc.createNestedObject("gps");
  gps["lat"] = currentLat;
  gps["lng"] = currentLng;
  gps["accuracy"] = 3.5;

  String body;
  serializeJson(doc, body);

  Serial.println("[VibeSafe] Transmitting SOS: " + body);
  int httpCode = http.POST(body);
  bool success = false;

  if (httpCode == 200 || httpCode == 201) {
    Serial.println("[VibeSafe] SOS Dispatched Successfully!");
    isEmergencyActive = true;
    triggerHaptic(4, 200);
    success = true;
  } else {
    Serial.printf("[VibeSafe ERROR] Status: %d\n", httpCode);
  }

  http.end();
  return success;
}

void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SERVER_URL) + "/api/v1/devices/heartbeat";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_API_KEY);

  float voltage = readBatteryVoltage();
  int pct = calculateBatteryPercent(voltage);

  StaticJsonDocument<256> doc;
  doc["batteryLevel"] = pct;
  doc["voltage"] = serialized(String(voltage, 2));
  doc["wifiSignal"] = WiFi.RSSI();

  JsonObject gps = doc.createNestedObject("gps");
  gps["lat"] = currentLat;
  gps["lng"] = currentLng;

  String body;
  serializeJson(doc, body);
  http.POST(body);
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("--- VibeSafe ESP32-C3 SuperMini Starting ---");

  pinMode(PIN_BUTTON_SOS, INPUT_PULLUP);
  pinMode(PIN_BUTTON_CANCEL, INPUT_PULLUP);
  pinMode(PIN_LED_STATUS, OUTPUT);
  pinMode(PIN_HAPTIC_BUZZER, OUTPUT);
  pinMode(PIN_BATTERY_ADC, INPUT);

  setLed(false);
  triggerHaptic(2, 80);
  connectWiFi();
}

void loop() {
  unsigned long now = millis();

  // Button debouncing & hold duration check
  if (digitalRead(PIN_BUTTON_SOS) == LOW) {
    if (!isButtonPressed) {
      isButtonPressed = true;
      buttonPressStartTime = now;
      setLed(true);
    } else {
      if ((now - buttonPressStartTime >= SOS_HOLD_TIME_MS) && !isEmergencyActive) {
        sendSosAlert();
      }
    }
  } else {
    if (isButtonPressed) {
      isButtonPressed = false;
      if (!isEmergencyActive) setLed(false);
    }
  }

  // Periodic heartbeat
  if (now - lastHeartbeatTime >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatTime = now;
    sendHeartbeat();
  }

  // Emergency strobe
  if (isEmergencyActive) {
    setLed((now / 250) % 2 == 0);
  }

  delay(20);
}`;

  const curlExample = `curl -X POST "https://your-vibesafe-deployment.vercel.app/api/v1/devices/sos" \\
  -H "Content-Type: application/json" \\
  -H "x-device-key: vs_dev_9f83a84b02e77b194d4a89c0" \\
  -d '{
    "batteryLevel": 88,
    "voltage": 4.12,
    "wifiSignal": -62,
    "gps": {
      "lat": 37.7749,
      "lng": -122.4194,
      "accuracy": 3.2
    },
    "triggerType": "hardware_button_sos",
    "notes": "Emergency button held on ESP32-C3 wearable."
  }'`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sampleFirmwareCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlExample);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <FileCode className="w-6 h-6 text-indigo-400" />
          ESP32-C3 SuperMini Firmware & Hardware Guide
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Complete schematic pinout, flashing workflow, and Arduino C++ firmware sketch for your wearable safety nodes
        </p>
      </div>

      {/* Hardware Specs & Pinout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Specs Card */}
        <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">ESP32-C3 SuperMini Specs</h3>
              <span className="text-[10px] text-gray-400 font-mono">Espressif RISC-V Architecture</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-gray-800">
              <span className="text-gray-400">Processor:</span>
              <span className="font-semibold text-gray-200">32-bit RISC-V Single-Core 160MHz</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-800">
              <span className="text-gray-400">Wireless:</span>
              <span className="font-semibold text-gray-200">Wi-Fi 802.11 b/g/n + BLE 5.0</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-800">
              <span className="text-gray-400">Memory:</span>
              <span className="font-semibold text-gray-200">400KB SRAM, 4MB Flash</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-800">
              <span className="text-gray-400">Operating Voltage:</span>
              <span className="font-semibold text-gray-200">3.3V (5V via USB-C)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-400">Deep Sleep Current:</span>
              <span className="font-semibold text-emerald-400 font-mono">~5 µA (Ultra-low)</span>
            </div>
          </div>
        </div>

        {/* Pinout Table */}
        <div className="lg:col-span-2 bg-gray-900/70 border border-gray-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Recommended Wearable Pinout
            </h3>
            <span className="text-[11px] font-mono text-gray-400">SuperMini GPIO Layout</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-gray-400 uppercase bg-gray-950/60 border-b border-gray-800">
                <tr>
                  <th className="p-2.5">GPIO Pin</th>
                  <th className="p-2.5">Hardware Component</th>
                  <th className="p-2.5">Type / Mode</th>
                  <th className="p-2.5">Function</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 font-mono text-[11px]">
                <tr>
                  <td className="p-2.5 font-bold text-red-400">GPIO 9</td>
                  <td className="p-2.5 text-white font-sans">Emergency SOS Button</td>
                  <td className="p-2.5 text-gray-400">INPUT_PULLUP</td>
                  <td className="p-2.5 text-gray-300 font-sans">Hold 1.5s to fire emergency REST event</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-yellow-400">GPIO 3</td>
                  <td className="p-2.5 text-white font-sans">Cancel / Secondary Switch</td>
                  <td className="p-2.5 text-gray-400">INPUT_PULLUP</td>
                  <td className="p-2.5 text-gray-300 font-sans">Cancel accidental triggers</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-blue-400">GPIO 8</td>
                  <td className="p-2.5 text-white font-sans">Onboard Blue LED</td>
                  <td className="p-2.5 text-gray-400">OUTPUT (Active LOW)</td>
                  <td className="p-2.5 text-gray-300 font-sans">Emergency strobe & Wi-Fi indicator</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-indigo-400">GPIO 2</td>
                  <td className="p-2.5 text-white font-sans">Haptic Motor / Buzzer</td>
                  <td className="p-2.5 text-gray-400">OUTPUT / PWM</td>
                  <td className="p-2.5 text-gray-300 font-sans">Vibration feedback upon SOS dispatch</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-emerald-400">GPIO 0</td>
                  <td className="p-2.5 text-white font-sans">Battery Voltage Sense</td>
                  <td className="p-2.5 text-gray-400">ADC1_CH0</td>
                  <td className="p-2.5 text-gray-300 font-sans">100k/100k voltage divider to LiPo cell</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-purple-400">GPIO 20/21</td>
                  <td className="p-2.5 text-white font-sans">NEO-6M / GPS Module</td>
                  <td className="p-2.5 text-gray-400">UART Serial1</td>
                  <td className="p-2.5 text-gray-300 font-sans">NMEA sentence latitude/longitude parsing</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Arduino Firmware Sketch */}
      <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              Arduino C++ Firmware Sketch (esp32_c3_vibesafe.ino)
            </h3>
            <p className="text-xs text-gray-400">
              Flash directly with Arduino IDE (Board: ESP32C3 Dev Module) or PlatformIO
            </p>
          </div>

          <button
            onClick={handleCopyCode}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copiedCode ? 'Copied to Clipboard!' : 'Copy Arduino Sketch'}
          </button>
        </div>

        <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-black/90">
          <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto max-h-[500px]">
            {sampleFirmwareCode}
          </pre>
        </div>
      </div>

      {/* REST API & Curl Testing Reference */}
      <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              REST API Terminal Test (cURL)
            </h3>
            <p className="text-xs text-gray-400">
              Trigger a test emergency directly from your terminal or script
            </p>
          </div>

          <button
            onClick={handleCopyCurl}
            className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCurl ? 'Copied' : 'Copy cURL'}
          </button>
        </div>

        <pre className="p-4 bg-black/90 rounded-xl border border-gray-800 text-xs font-mono text-emerald-400 overflow-x-auto">
          {curlExample}
        </pre>
      </div>
    </div>
  );
};
