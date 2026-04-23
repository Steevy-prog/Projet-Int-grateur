#include <DHT.h>
#include <EEPROM.h>

#define PIN_LDR       34
#define PIN_DHT        4
#define PIN_TRIG      12
#define PIN_ECHO      13
#define PIN_POMPE     14
#define PIN_VENTILO   27
#define PIN_LED        2
#define PIN_SOL_HUM   35
#define PIN_GAZ       32

#define TYPE_DHT      DHT11
#define EEPROM_SIZE   512

struct Settings {
  float tempMax;        // 30.0 °C
  float tempChaud;    
  float tempFroid;
  int   solHumMin;      // 35 %
  int   gazMax;         // 1000 PPM
  int   ldrMinLux;      // 300 Lux
  int   niveauEauMin;   // 20 %
  float reservoirHauteur; 
  float reservoirOffset;
};

Settings config;
#include "ldr.h"
#include "ultrasonic.h"
#include "dht11.h"
#include "soil.h"
#include "gas.h"
#include "pompe.h"
#include "ventilation.h"
#include "lumiere.h"

DHT dht(PIN_DHT, TYPE_DHT);
bool pompeActive = false;
const unsigned long PERIODE_MS = 5000UL;

void setup() {
  Serial.begin(115200);
  dht.begin();
  EEPROM.begin(EEPROM_SIZE);
  pinMode(PIN_POMPE, OUTPUT);
  pinMode(PIN_VENTILO, OUTPUT);
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);

  digitalWrite(PIN_POMPE, LOW);
  digitalWrite(PIN_VENTILO, LOW);
  digitalWrite(PIN_LED, LOW);

  chargerParam();
}

void loop() {
  static unsigned long dernierCycle = 0;
  if (Serial.available()) {
    String msg = Serial.readStringUntil('\n');
    msg.trim();
    traiterMessageWeb(msg);
  }

  if (millis() - dernierCycle >= PERIODE_MS) {
    dernierCycle = millis();

    //1.lecture
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    int ldrBrut = analogRead(PIN_LDR);
    int gazBrut = analogRead(PIN_GAZ);
    float dist = mesurerDistance(PIN_TRIG, PIN_ECHO, config.reservoirHauteur, config.reservoirOffset);
    int niveau = calculerNiveauPct(dist, config.reservoirHauteur, config.reservoirOffset);
    int solHum = lireHumiditeSol(PIN_SOL_HUM);


    //2.conversion en unités physiques
    int luxActuel = calculerLux(ldrBrut);
    int ppmActuel = calculerPPM(gazBrut);
    int niveauPct = calculerNiveauPct(dist, config.reservoirHauteur, config.reservoirOffset);

    //3.affichage et debug
    lireLDR(luxActuel, config); 
    lireDHT11(t, h, !isnan(t), dht, config);
    lireReservoir(dist, niveauPct, config);

    //4.gestion des actionneurs
    gererPompeAuto(niveauPct, t, solHum);
    gererVentilation(t, ppmActuel, config, PIN_VENTILO);
    gererLumiere(luxActuel, config, PIN_LED);

    //5.envoie des données
    envoyerDonneesWeb(t, h, luxActuel, niveauPct, solHum, ppmActuel);
  }
}

void gererPompeAuto(int niveauPct, float temp, int solHum) {
  if (niveauPct <= config.niveauEauMin) {
    setPompe(false);
    Serial.println(F("ALERTE : Reservoir trop bas, pompe bloquee !"));
    return;
  }
  //déclenchement si le sol est trop sec ou si la température est trop haute
  bool besoinEau = (solHum < config.solHumMin) || (temp > config.tempMax);
  setPompe(besoinEau);
}

void setPompe(bool activer) {
  if (activer != pompeActive) {
    pompeActive = activer;
    digitalWrite(PIN_POMPE, activer ? HIGH : LOW);
    Serial.print(F("POMPE : ")); Serial.println(activer ? "ON" : "OFF");
  }
}

void envoyerDonneesWeb(float t, float h, int l, int n, int s, int g) {
  Serial.print(F("{\"temp\":")); Serial.print(t,1);
  Serial.print(F(",\"humid\":")); Serial.print(h,1);
  Serial.print(F(",\"ldr\":")); Serial.print(l);
  Serial.print(F(",\"niveau\":")); Serial.print(n);
  Serial.print(F(",\"soil\":")); Serial.print(s);
  Serial.print(F(",\"gas\":")); Serial.print(g);
  Serial.print(F(",\"pompe\":")); Serial.print(pompeActive ? "true" : "false");
  Serial.println(F("}"));
}

void chargerParam() {
  EEPROM.get(0, config);
  if (isnan(config.tempMax) || config.solHumMin <= 0) {
    config.tempMax = 30.0f;
    config.tempChaud = 35.0f;
    config.tempFroid = 15.0f;
    config.solHumMin = 35;
    config.gazMax = 1000;
    config.ldrMinLux = 300;
    config.niveauEauMin = 20;
    config.reservoirHauteur = 20.0f;
    config.reservoirOffset = 2.0f;
    EEPROM.put(0, config);
    EEPROM.commit();
    Serial.println(F("EEPROM : valeurs par defaut initialisees"));
  }
}

void traiterMessageWeb(String msg) {
  int idx = msg.indexOf(':');
  if (idx == -1) return;
  String cle = msg.substring(0, idx);
  float val = msg.substring(idx + 1).toFloat();

  if      (cle == "T_MAX")   config.tempMax = val;
  else if (cle == "SOL_MIN") config.solHumMin = (int)val;
  else if (cle == "GAZ_MAX") config.gazMax = (int)val;
  else if (cle == "LDR_MIN") config.ldrMinLux = (int)val;
  else if (cle == "H2O_MIN") config.niveauEauMin = (int)val;

  EEPROM.put(0, config);
  EEPROM.commit();
  Serial.print(F("Seuil mis a jour : ")); Serial.print(cle); Serial.print(F(" -> ")); Serial.println(val);
}