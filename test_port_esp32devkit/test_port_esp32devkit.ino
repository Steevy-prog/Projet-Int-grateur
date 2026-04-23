//test des ports pour esp32 DEVKIT
const int digitalPins[] = {12, 13, 14, 25, 26, 27}; 
const int analogPins[] = {32, 33, 34, 35};

void setup() {
  Serial.begin(115200);
  for(int p : digitalPins) pinMode(p, OUTPUT);
  Serial.println("Debut du test ESP32 DEVKIT...");
}

void loop() {
  //test de sorties digitales (LCD/Ultrason)
  for(int p : digitalPins) {
    digitalWrite(p, HIGH);
    delay(200);
    digitalWrite(p, LOW);
  }

  //test des entrées analogiques (capteurs)
  for(int p : analogPins) {
    Serial.print("Pin "); Serial.print(p);
    Serial.print(" Valeur: "); Serial.println(analogRead(p));
  }
  delay(1000);
}