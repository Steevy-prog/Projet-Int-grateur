#include <DHT.h>
#include <EEPROM.h>

#define PIN_LDR       34
#define PIN_DHT        4
#define PIN_TRIG      12
#define PIN_ECHO      13
#define PIN_POMPE     14
#define PIN_LED        2
#define PIN_SOL_HUM   35 //pour le capteur d'humidité du sol
#define PIN_GAZ       32 //pour le capteur de gaz

#define TYPE_DHT      DHT11
#define EEPROM_SIZE   128

struct Settings {
  //seuils déclenchant l'arrosage 
  float tempArrosage; 
  float humidArrosage; 
  int seuilLuminosite;
  
  //seuils réservoir
  int niveauCritique; 
  int niveauBas; 
  int niveauOk;
  float reservoirHauteur; 
  float reservoirOffset;

  //seuils LDR
  int ldrNuit; 
  int ldrFaible; 
  int ldrMoyen;

  //seuils température DHT11
  float tempGel; 
  float tempFroid; 
  float tempChaud;

  //seuils humidité DHT11
  float humidSecheresse; 
  float humidHaut;
};

// Inclusion des modules personnalisés
Settings config;
#include "ldr.h"
#include "ultrasonic.h"
#include "dth11.h"
//ajout des modules pour l'humidité du sol et le CO2

DHT dht(PIN_DHT, TYPE_DHT);
bool pompeActive = false;
const unsigned long PERIODE_MS = 5000UL;

void setup() {
  Serial.begin(115200);
  dht.begin();
  EEPROM.begin(EEPROM_SIZE);

  pinMode(PIN_POMPE, OUTPUT);
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  
  //initialisation des capteurs humidité du sol et CO2
  //pinMode(PIN_SOL_HUM, INPUT);
  //pinMode(PIN_GAZ, INPUT);

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

    //lectures
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    int ldrBrut = analogRead(PIN_LDR);
    float dist = mesurerDistance(PIN_TRIG, PIN_ECHO, config.reservoirHauteur, config.reservoirOffset);
    int niveau = calculerNiveauPct(dist, config.reservoirHauteur, config.reservoirOffset);

    //traitements via les fichiers .h
    lireLDR(ldrBrut, (ldrBrut / 4095.0f) * 100.0f, config, PIN_LED);
    lireDHT11(t, h, (!isnan(t) && !isnan(h)), dht, config);
    afficherReservoir(dist, niveau, config);

    //emplacement pour futurs capteurs
    // int solHum = analogRead(PIN_SOL_HUM);
    // int gazVal = analogRead(PIN_GAZ);

    //actionneurs et communication
    gererPompeAuto(niveau, ldrBrut, t, h, !isnan(t));
    envoyerDonneesWeb(t, h, ldrBrut, dist, niveau);
  }
}

//format : "CLE:VALEUR\n"   ex: "TEMP:30.5"
void traiterMessageWeb(String msg) {
  int idx = msg.indexOf(':');
  if (idx == -1) return;

  String cle = msg.substring(0, idx);
  float  valeur = msg.substring(idx + 1).toFloat();

  //seuils arrosage
  if      (cle == "TEMP")        config.tempArrosage = valeur;
  else if (cle == "HUMID")       config.humidArrosage = valeur;
  else if (cle == "LUMINOSITE")  config.seuilLuminosite = (int)valeur;

  //Seuils réservoir
  else if (cle == "CRITIQUE")    config.niveauCritique = (int)valeur;
  else if (cle == "BAS")         config.niveauBas = (int)valeur;
  else if (cle == "OK")          config.niveauOk = (int)valeur;
  else if (cle == "RES_HAUT")    config.reservoirHauteur = valeur;
  else if (cle == "RES_OFFSET")  config.reservoirOffset = valeur;

  //seuils LDR
  else if (cle == "LDR_NUIT")    config.ldrNuit = (int)valeur;
  else if (cle == "LDR_FAIBLE")  config.ldrFaible = (int)valeur;
  else if (cle == "LDR_MOYEN")   config.ldrMoyen = (int)valeur;

  //seuils température
  else if (cle == "T_GEL")       config.tempGel = valeur;
  else if (cle == "T_FROID")     config.tempFroid = valeur;
  else if (cle == "T_CHAUD")     config.tempChaud = valeur;

  //seuils humidité
  else if (cle == "H_SEC")       config.humidSecheresse = valeur;
  else if (cle == "H_HAUT")      config.humidHaut = valeur;

  else {
    Serial.println(F("[Web] Commande inconnue."));
    return;
  }

  EEPROM.put(0, config);
  EEPROM.commit();

  Serial.print(F("[Web] Mis a jour : "));
  Serial.print(cle); Serial.print(F(" = ")); Serial.println(valeur);
}


void chargerParam() {
  EEPROM.get(0, config);
  bool invalide = isnan(config.tempArrosage) || config.tempArrosage <= 0.0f || config.humidArrosage <= 0.0f || config.seuilLuminosite <= 0 || config.reservoirHauteur <= 0.0f;

  if (invalide) {
    config.tempArrosage = 28.0f;
    config.humidArrosage = 40.0f;
    config.seuilLuminosite = 2500;

    config.niveauCritique = 10;
    config.niveauBas = 25;
    config.niveauOk = 60;
    config.reservoirHauteur = 20.0f;
    config.reservoirOffset = 2.0f;

    config.ldrNuit = 300;
    config.ldrFaible = 1000;
    config.ldrMoyen = 2500;

    config.tempGel = 5.0f;
    config.tempFroid = 15.0f;
    config.tempChaud = 35.0f;

    config.humidSecheresse = 20.0f;
    config.humidHaut = 80.0f;

    EEPROM.put(0, config);
    EEPROM.commit();
    Serial.println(F("[EEPROM] Valeurs par defaut appliquees."));
  } else {
    Serial.println(F("[EEPROM] Parametres charges avec succes."));
  }
}

//envoi des données en format json au site web
void envoyerDonneesWeb(float temp, float humid, int ldr, float dist, int niveau) {
  Serial.print(F("{\"temp\":"));   Serial.print(temp,  1);
  Serial.print(F(",\"humid\":"));  Serial.print(humid, 1);
  Serial.print(F(",\"ldr\":"));    Serial.print(ldr);
  Serial.print(F(",\"dist\":"));   Serial.print(dist,  1);
  Serial.print(F(",\"niveau\":")); Serial.print(niveau);
  Serial.print(F(",\"pompe\":"));  Serial.print(pompeActive ? "true" : "false");
  Serial.println(F("}"));
}

void setPompe(bool activer) {
  if (activer != pompeActive) {
    pompeActive = activer;
    digitalWrite(PIN_POMPE, activer ? HIGH : LOW);
  }
}

//logique de la pompe
void gererPompeAuto(int niveauPct, int ldrBrut, float temp, float humid, bool dhtOK) {

  if (niveauPct <= config.niveauCritique) {
    setPompe(false);
    Serial.println(F("Pompe bloquee: le reservoir est insuffisant"));
    return;
  }

  bool parChaleur = dhtOK && (temp  > config.tempArrosage);
  bool parSecheresse = dhtOK && (humid < config.humidArrosage);
  bool parLuminosite = (ldrBrut > config.seuilLuminosite);

  bool arroser = parChaleur || parSecheresse || parLuminosite;

  if (arroser) {
    setPompe(true);
    Serial.print(F("[POMPE] Activee —"));
    if (parChaleur)    Serial.print(F(" Chaleur"));
    if (parSecheresse) Serial.print(F(" Air sec"));
    if (parLuminosite) Serial.print(F(" Forte lumiere"));
    Serial.println();
  } else {
    setPompe(false);
    Serial.println(F("Pompe en veille."));
  }
}




