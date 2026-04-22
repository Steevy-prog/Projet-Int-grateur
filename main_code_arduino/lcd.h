#ifndef LCD_H
#define LCD_H

#include <LiquidCrystal.h>

// Pins basés sur ton schéma Proteus (RS, E, D4, D5, D6, D7)
LiquidCrystal lcd(13, 12, 14, 27, 26, 25);

void initialiserLCD() {
  lcd.begin(16, 2);
  lcd.clear();
  lcd.print("SYSTEME SMART");
  lcd.setCursor(0, 1);
  lcd.print("INITIALISATION..");
  delay(2000);
}

// Fonction pour alterner l'affichage (à appeler dans la boucle principale)
void rafraichirAffichage(float t, float h, int sol, int niveau, int lux, int gas) {
  static unsigned long lastUpdate = 0;
  static bool page1 = true;

  if (millis() - lastUpdate > 10000) { // Change de page toutes les 10 secondes
    page1 = !page1;
    lastUpdate = millis();
    lcd.clear();
  }

  if (page1) {
    //page 1: environnement
    lcd.setCursor(0, 0);
    lcd.print("T:"); lcd.print((int)t); lcd.print("C H:"); lcd.print((int)h); lcd.print("%");
    lcd.setCursor(0, 1);
    lcd.print("LUM:"); lcd.print(lux); lcd.print(" GAZ:"); lcd.print(gas);
  } else {
    //page 2: ressources
    lcd.setCursor(0, 0);
    lcd.print("SOL:"); lcd.print(sol); lcd.print("%");
    lcd.setCursor(0, 1);
    lcd.print("EAU:"); lcd.print(niveau); lcd.print("%");
    if (gas > 1000) { lcd.print(" !GAZ!"); } // Alerte visuelle rapide
  }
}

#endif