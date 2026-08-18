/*
 ==============================================================================
  VibeSafe - ESP32-C3 SuperMini SOS Emergency Wearable Firmware
 ==============================================================================
  Hardware:
    - Microcontroller: ESP32-C3 SuperMini (RISC-V 160MHz, Wi-Fi 4 + BLE 5)
    - SOS Trigger Button: GPIO 9 (Active LOW, internal pullup)
    - Cancel / Test Button: GPIO 3 (Active LOW, internal pullup)
    - Status Indicator LED: GPIO 8 (Active LOW on SuperMini board)
    - Haptic Buzzer / Vibrator: GPIO 2
    - Battery Voltage Sense: GPIO 0 (ADC1_CH0 via 100k/100k voltage divider)
    - Optional GPS (NEO-6M): RX=GPIO 20, TX=GPIO 21

  API Protocol:
    - Ingestion Endpoint: POST /api/v1/devices/sos
    - Heartbeat Endpoint: POST /api/v1/devices/heartbeat
    - Auth Header: "x-device-key: <YOUR_DEVICE_API_KEY>"
 ==============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // ArduinoJson v6 or v7

// ==========================================
// 1. CONFIGURATION & CREDENTIALS
// ==========================================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// VibeSafe Server Host (e.g. "https://your-vibesafe.vercel.app" or "http://192.168.1.100:3001")
const char* SERVER_URL    = "http://192.168.1.100:3001"; 

// Device Credentials (Obtained from VibeSafe Dashboard -> Registered Devices)
const char* DEVICE_ID     = "VS-ESP32-C3-01";
const char* DEVICE_API_KEY = "vs_dev_9f83a84b02e77b194d4a89c0";

// ==========================================
// 2. HARDWARE PIN DEFINITIONS (ESP32-C3)
// ==========================================
#define PIN_BUTTON_SOS    9   // Built-in boot button or external tactile switch
#define PIN_BUTTON_CANCEL 3   // Secondary button to cancel false alarms
#define PIN_LED_STATUS    8   // Onboard LED on ESP32-C3 SuperMini (Active LOW)
#define PIN_HAPTIC_BUZZER 2   // PWM / Digital pin for buzzer or vibration motor
#define PIN_BATTERY_ADC   0   // ADC pin connected to battery voltage divider

// Timing constants
const unsigned long SOS_HOLD_TIME_MS      = 1500;  // Must hold button for 1.5s to trigger
const unsigned long HEARTBEAT_INTERVAL_MS = 60000; // Heartbeat sent every 60 seconds
const unsigned long DEBOUNCE_TIME_MS      = 50;

// State Variables
unsigned long lastHeartbeatTime = 0;
unsigned long buttonPressStartTime = 0;
bool isButtonPressed = false;
bool isEmergencyActive = false;

// Simulated/Default coordinates if GPS hardware is not connected
float currentLat = 37.7749;
float currentLng = -122.4194;

// ==========================================
// 3. UTILITY FUNCTIONS
// ==========================================

void setLed(bool on) {
  // ESP32-C3 SuperMini onboard LED is inverted (LOW = ON)
  digitalWrite(PIN_LED_STATUS, on ? LOW : HIGH);
}

void triggerHapticFeedback(int pulses, int durationMs) {
  for (int i = 0; i < pulses; i++) {
    digitalWrite(PIN_HAPTIC_BUZZER, HIGH);
    setLed(true);
    delay(durationMs);
    digitalWrite(PIN_HAPTIC_BUZZER, LOW);
    setLed(false);
    if (i < pulses - 1) delay(durationMs);
  }
}

float readBatteryVoltage() {
  // Read ADC raw value (12-bit: 0 - 4095)
  // Voltage divider: 2x 100k resistors -> ADC reads Vbat / 2
  int raw = analogRead(PIN_BATTERY_ADC);
  float pinVoltage = (raw / 4095.0) * 3.3;
  float batteryVoltage = pinVoltage * 2.0; // Account for 1:1 voltage divider
  return batteryVoltage;
}

int calculateBatteryPercent(float voltage) {
  // Typical LiPo/Li-Ion curve: 3.3V (0%) to 4.2V (100%)
  if (voltage >= 4.20) return 100;
  if (voltage <= 3.30) return 0;
  int percent = (int)((voltage - 3.30) / (4.20 - 3.30) * 100.0);
  return constrain(percent, 0, 100);
}

void connectToWiFi() {
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);
  setLed(true);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(400);
    Serial.print(".");
    setLed(attempts % 2 == 0);
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
    setLed(false);
  } else {
    Serial.println("\n[WiFi] Connection timeout. Retrying in background...");
    setLed(false);
  }
}

// ==========================================
// 4. REST API CLIENT FUNCTIONS
// ==========================================

bool sendSosAlert() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[VibeSafe ERROR] Cannot send SOS - No Wi-Fi!");
      return false;
    }
  }

  HTTPClient http;
  String endpoint = String(SERVER_URL) + "/api/v1/devices/sos";

  http.begin(endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_API_KEY);

  float voltage = readBatteryVoltage();
  int batteryPct = calculateBatteryPercent(voltage);
  int rssi = WiFi.RSSI();

  // Create JSON Payload
  StaticJsonDocument<512> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["batteryLevel"] = batteryPct;
  doc["voltage"] = serialized(String(voltage, 2));
  doc["wifiSignal"] = rssi;
  doc["triggerType"] = "hardware_button_sos";
  doc["notes"] = "Emergency SOS button triggered from ESP32-C3 SuperMini";

  JsonObject gps = doc.createNestedObject("gps");
  gps["lat"] = currentLat;
  gps["lng"] = currentLng;
  gps["accuracy"] = 3.5;

  String requestBody;
  serializeJson(doc, requestBody);

  Serial.println("\n==========================================");
  Serial.println("🚨 TRANSMITTING EMERGENCY SOS ALERT 🚨");
  Serial.println("==========================================");
  Serial.println("POST " + endpoint);
  Serial.println("Payload: " + requestBody);

  int httpCode = http.POST(requestBody);
  bool success = false;

  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP] Status: %d\n", httpCode);
    Serial.println("[HTTP] Response: " + response);
    if (httpCode == 200 || httpCode == 201) {
      success = true;
      isEmergencyActive = true;
      // High priority haptic and LED alert acknowledgment
      triggerHapticFeedback(4, 200);
    }
  } else {
    Serial.printf("[HTTP] POST failed, error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
  return success;
}

void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  HTTPClient http;
  String endpoint = String(SERVER_URL) + "/api/v1/devices/heartbeat";

  http.begin(endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_API_KEY);

  float voltage = readBatteryVoltage();
  int batteryPct = calculateBatteryPercent(voltage);
  int rssi = WiFi.RSSI();

  StaticJsonDocument<256> doc;
  doc["batteryLevel"] = batteryPct;
  doc["voltage"] = serialized(String(voltage, 2));
  doc["wifiSignal"] = rssi;

  JsonObject gps = doc.createNestedObject("gps");
  gps["lat"] = currentLat;
  gps["lng"] = currentLng;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode == 200) {
    Serial.println("[Heartbeat] Ping sent successfully. Battery: " + String(batteryPct) + "%");
  }
  http.end();
}

// ==========================================
// 5. ARDUINO SETUP & MAIN LOOP
// ==========================================

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- VibeSafe ESP32-C3 SuperMini Booting ---");

  // Configure GPIOs
  pinMode(PIN_BUTTON_SOS, INPUT_PULLUP);
  pinMode(PIN_BUTTON_CANCEL, INPUT_PULLUP);
  pinMode(PIN_LED_STATUS, OUTPUT);
  pinMode(PIN_HAPTIC_BUZZER, OUTPUT);
  pinMode(PIN_BATTERY_ADC, INPUT);

  setLed(false);
  digitalWrite(PIN_HAPTIC_BUZZER, LOW);

  // Power-on quick double blink
  triggerHapticFeedback(2, 80);

  // Connect to Wi-Fi
  connectToWiFi();
}

void loop() {
  unsigned long currentMillis = millis();

  // --- 1. Check SOS Button with Hold-to-Trigger Debounce ---
  int sosButtonState = digitalRead(PIN_BUTTON_SOS);

  if (sosButtonState == LOW) { // Button pressed
    if (!isButtonPressed) {
      isButtonPressed = true;
      buttonPressStartTime = currentMillis;
      setLed(true);
    } else {
      // Button is being held
      unsigned long heldDuration = currentMillis - buttonPressStartTime;
      if (heldDuration >= SOS_HOLD_TIME_MS && !isEmergencyActive) {
        Serial.println("[BUTTON] SOS Hold Threshold reached! Firing SOS...");
        sendSosAlert();
      }
    }
  } else { // Button released
    if (isButtonPressed) {
      isButtonPressed = false;
      if (!isEmergencyActive) {
        setLed(false);
      }
    }
  }

  // --- 2. Periodic Heartbeat ---
  if (currentMillis - lastHeartbeatTime >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatTime = currentMillis;
    sendHeartbeat();
  }

  // --- 3. Active Emergency LED Strobe ---
  if (isEmergencyActive) {
    if ((currentMillis / 250) % 2 == 0) {
      setLed(true);
    } else {
      setLed(false);
    }
  }

  delay(20);
}
