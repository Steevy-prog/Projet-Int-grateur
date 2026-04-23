//test des ports pour esp32-WROOM
void setup() {
  Serial.begin(115200);
  //test sur les pins de données communs
  for(int i=4; i<=19; i++) pinMode(i, OUTPUT);
}

void loop() {
  Serial.println("Balayage des ports WROOM...");
  for(int i=4; i<=19; i++) {
    digitalWrite(i, HIGH);
    delay(100);
    digitalWrite(i, LOW);
  }
}