"use strict";
// Menu, contextual tutorial and guide translations. Gameplay content uses separate modules.
const LANGUAGE_NAMES={
  "en": "English",
  "es": "Español",
  "pt": "Português",
  "fr": "Français",
  "de": "Deutsch",
  "it": "Italiano",
  "pl": "Polski",
  "tr": "Türkçe",
  "id": "Indonesia",
  "hi": "हिन्दी",
  "ja": "日本語",
  "ko": "한국어",
  "zh": "中文",
  "ar": "العربية",
  "ru": "Русский"
};
const LANGUAGE_PACKS={
  "es": {
    "ui": {
      "play": "JUGAR",
      "resume": "CONTINUAR",
      "restart": "NUEVA PARTIDA",
      "pause": "Pausa",
      "language": "Idioma",
      "tagline": "Sobrevive a 20 etapas. Equípate. Llega al final.",
      "gotit": "Entendido",
      "skip": "Omitir tutorial",
      "replay": "Repetir tutorial",
      "guide": "Guía del juego",
      "close": "Cerrar ✕",
      "saveError": "No se pudo guardar el idioma.",
      "saveTutorial": "No se pudo guardar el tutorial.",
      "soundOn": "Activar sonido",
      "soundOff": "Silenciar",
      "soundHost": "La plataforma ha desactivado el sonido",
      "saveSound": "No se pudo guardar el sonido.",
      "stage": "Etapa",
      "level": "Nivel",
      "defeated": "Derrotados",
      "mainMenu": "MENÚ PRINCIPAL",
      "newRun": "NUEVA PARTIDA"
    },
    "tips": {
      "welcome": [
        "¡Bienvenido!",
        "Pulsa Jugar. Las pistas aparecerán poco a poco; el combate se pausa mientras las lees."
      ],
      "move": [
        "Muévete y esquiva",
        "Arrastra el dedo por la arena o mueve el ratón. El héroe te sigue y dispara automáticamente. Pulsa Entendido y aléjate de los enemigos rojos."
      ],
      "health": [
        "Salud y experiencia",
        "La salud y la barra de XP están arriba a la izquierda. Derrotar enemigos da XP al instante. No te dejes rodear."
      ],
      "upgrade": [
        "Mejora tu héroe",
        "Elige una carta para mejorar al héroe, arma o mascota. La XP aumenta el nivel; el tiempo hace avanzar las etapas."
      ],
      "item": [
        "Usa un objeto",
        "El botón inferior derecho o Espacio usa tu mina, granada o hielo. El objeto se consume."
      ],
      "ultimate": [
        "Habilidad definitiva",
        "Pulsa el rayo, toca dos veces la arena o separa dos dedos. Después debes recargar la habilidad."
      ],
      "inventory": [
        "Reserva de habilidades",
        "Los cofres raros dan un ataque aéreo, niebla tóxica o tanque al azar. Cada uso gasta una carga. Las restantes se conservan al morir o salir."
      ],
      "menu": [
        "Menú y ayuda",
        "Pausa arriba a la izquierda: continúa, reinicia o cambia el idioma y el sonido. «?» abre la guía."
      ],
      "altar": [
        "El altar",
        "Tras 20 etapas de un minuto aparece el altar en el minimapa. Quédate dos segundos en su círculo para terminar. Tras cinco minutos extra, el dragón llegará automáticamente."
      ],
      "restart": [
        "Nueva partida",
        "Empieza desde la primera etapa. Conservas las mejoras permanentes y las cargas sin usar."
      ],
      "resume": [
        "Continuar",
        "Vuelve al mismo combate. El tiempo de las etapas no avanza durante la pausa."
      ]
    }
  },
  "pt": {
    "ui": {
      "play": "JOGAR",
      "resume": "CONTINUAR",
      "restart": "NOVA PARTIDA",
      "pause": "Pausa",
      "language": "Idioma",
      "tagline": "Sobreviva a 20 etapas. Equipe-se. Chegue ao final.",
      "gotit": "Entendi",
      "skip": "Pular tutorial",
      "replay": "Repetir tutorial",
      "guide": "Guia do jogo",
      "close": "Fechar ✕",
      "saveError": "Não foi possível salvar o idioma.",
      "saveTutorial": "Não foi possível salvar o tutorial.",
      "soundOn": "Ativar som",
      "soundOff": "Silenciar",
      "soundHost": "O som foi desativado pela plataforma",
      "saveSound": "Não foi possível salvar o som.",
      "stage": "Etapa",
      "level": "Nível",
      "defeated": "Derrotados",
      "mainMenu": "MENU PRINCIPAL",
      "newRun": "NOVA PARTIDA"
    },
    "tips": {
      "welcome": [
        "Boas-vindas!",
        "Toque em Jogar. As dicas aparecem aos poucos; o combate pausa enquanto você lê."
      ],
      "move": [
        "Mova-se e desvie",
        "Arraste o dedo na arena ou mova o mouse. O herói segue você e atira automaticamente. Toque em Entendi e afaste-se dos inimigos vermelhos."
      ],
      "health": [
        "Vida e experiência",
        "A vida e a barra de XP ficam no alto à esquerda. Derrotar inimigos dá XP na hora. Não deixe que cerquem você."
      ],
      "upgrade": [
        "Melhore seu herói",
        "Escolha uma carta para melhorar o herói, arma ou mascote. XP aumenta o nível; o tempo avança as etapas."
      ],
      "item": [
        "Use um item",
        "O botão inferior direito ou Espaço usa a mina, granada ou gelo. O item é consumido."
      ],
      "ultimate": [
        "Habilidade suprema",
        "Toque no raio, toque duas vezes na arena ou afaste dois dedos. A carga se recupera depois do uso."
      ],
      "inventory": [
        "Reserva de habilidades",
        "Baús raros dão uma carga aleatória de ataque aéreo, névoa tóxica ou tanque. Cada uso gasta uma. As restantes ficam salvas ao morrer ou sair."
      ],
      "menu": [
        "Menu e ajuda",
        "Pausa no canto superior esquerdo: continue, reinicie ou ajuste idioma e som. «?» abre o guia."
      ],
      "altar": [
        "O altar",
        "Após 20 etapas de um minuto, o altar aparece no minimapa. Fique dois segundos no círculo para terminar. Após cinco minutos extras, o dragão chega automaticamente."
      ],
      "restart": [
        "Nova partida",
        "Comece na primeira etapa. Melhorias permanentes e cargas não usadas são mantidas."
      ],
      "resume": [
        "Continuar",
        "Volte ao mesmo combate. O tempo das etapas não passa durante a pausa."
      ]
    }
  },
  "fr": {
    "ui": {
      "play": "JOUER",
      "resume": "CONTINUER",
      "restart": "NOUVELLE PARTIE",
      "pause": "Pause",
      "language": "Langue",
      "tagline": "Survis à 20 étapes. Équipe-toi. Atteins la finale.",
      "gotit": "Compris",
      "skip": "Passer le tutoriel",
      "replay": "Rejouer le tutoriel",
      "guide": "Guide du jeu",
      "close": "Fermer ✕",
      "saveError": "Impossible de sauvegarder la langue.",
      "saveTutorial": "Impossible de sauvegarder le tutoriel.",
      "soundOn": "Activer le son",
      "soundOff": "Couper le son",
      "soundHost": "Son désactivé par la plateforme",
      "saveSound": "Impossible de sauvegarder le réglage audio.",
      "stage": "Étape",
      "level": "Niveau",
      "defeated": "Vaincus",
      "mainMenu": "MENU PRINCIPAL",
      "newRun": "NOUVELLE PARTIE"
    },
    "tips": {
      "welcome": [
        "Bienvenue !",
        "Appuie sur Jouer. Les conseils apparaissent progressivement ; le combat s'arrête pendant leur lecture."
      ],
      "move": [
        "Bouge et esquive",
        "Glisse le doigt sur l'arène ou déplace la souris. Le héros te suit et tire automatiquement. Appuie sur Compris, puis éloigne-toi des ennemis rouges."
      ],
      "health": [
        "Vie et expérience",
        "La vie et la barre d'XP sont en haut à gauche. Les ennemis vaincus donnent immédiatement de l'XP. Évite de te faire encercler."
      ],
      "upgrade": [
        "Améliore ton héros",
        "Choisis une carte pour améliorer le héros, son arme ou son compagnon. L'XP augmente le niveau ; le temps fait avancer les étapes."
      ],
      "item": [
        "Utilise un objet",
        "Le bouton en bas à droite ou Espace utilise ta mine, grenade ou glace. L'objet est consommé."
      ],
      "ultimate": [
        "Capacité ultime",
        "Appuie sur l'éclair, touche deux fois l'arène ou écarte deux doigts. La capacité se recharge après utilisation."
      ],
      "inventory": [
        "Réserve de capacités",
        "Les coffres rares donnent aléatoirement une frappe aérienne, un brouillard toxique ou un char. Chaque utilisation consomme une charge. Les autres restent après la mort ou la déconnexion."
      ],
      "menu": [
        "Menu et aide",
        "Pause en haut à gauche : reprendre, recommencer, choisir la langue et le son. « ? » ouvre le guide."
      ],
      "altar": [
        "L'autel",
        "Après 20 étapes d'une minute, l'autel apparaît sur la minicarte. Reste deux secondes dans le cercle pour terminer. Après cinq minutes supplémentaires, le dragon arrive automatiquement."
      ],
      "restart": [
        "Nouvelle partie",
        "Recommence à la première étape. Les améliorations permanentes et charges inutilisées sont conservées."
      ],
      "resume": [
        "Continuer",
        "Reprends le même combat. Le temps des étapes n'avance pas pendant la pause."
      ]
    }
  },
  "de": {
    "ui": {
      "play": "SPIELEN",
      "resume": "FORTSETZEN",
      "restart": "NEUER LAUF",
      "pause": "Pause",
      "language": "Sprache",
      "tagline": "Überlebe 20 Phasen. Rüste dich aus. Erreiche das Finale.",
      "gotit": "Verstanden",
      "skip": "Tutorial überspringen",
      "replay": "Tutorial wiederholen",
      "guide": "Spielanleitung",
      "close": "Schließen ✕",
      "saveError": "Sprache konnte nicht gespeichert werden.",
      "saveTutorial": "Tutorial konnte nicht gespeichert werden.",
      "soundOn": "Ton einschalten",
      "soundOff": "Ton ausschalten",
      "soundHost": "Ton von der Plattform deaktiviert",
      "saveSound": "Toneinstellung konnte nicht gespeichert werden.",
      "stage": "Phase",
      "level": "Level",
      "defeated": "Besiegt",
      "mainMenu": "HAUPTMENÜ",
      "newRun": "NEUER LAUF"
    },
    "tips": {
      "welcome": [
        "Willkommen!",
        "Drücke Spielen. Tipps erscheinen nach und nach. Während du liest, pausiert der Kampf."
      ],
      "move": [
        "Bewegen und ausweichen",
        "Ziehe den Finger über die Arena oder bewege die Maus. Dein Held folgt dir und schießt automatisch. Drücke Verstanden und weiche den roten Gegnern aus."
      ],
      "health": [
        "Leben und Erfahrung",
        "Leben und EP-Leiste sind oben links. Besiegte Gegner geben sofort EP. Lass dich nicht umzingeln."
      ],
      "upgrade": [
        "Verbessere deinen Helden",
        "Wähle eine Karte für Held, Waffe oder Begleiter. EP erhöhen dein Level; die Phasen schreiten mit der Zeit voran."
      ],
      "item": [
        "Gegenstand benutzen",
        "Mit der Taste unten rechts oder der Leertaste benutzt du Mine, Granate oder Eis. Der Gegenstand wird verbraucht."
      ],
      "ultimate": [
        "Ultimative Fähigkeit",
        "Drücke den Blitz, tippe doppelt auf die Arena oder spreize zwei Finger. Danach lädt sich die Fähigkeit wieder auf."
      ],
      "inventory": [
        "Fähigkeitsvorrat",
        "Seltene Truhen geben zufällig Luftangriff, Giftnebel oder Panzer. Jede Nutzung verbraucht eine Ladung. Unbenutzte Ladungen bleiben nach Tod und Verlassen erhalten."
      ],
      "menu": [
        "Menü und Hilfe",
        "Pause oben links: fortsetzen, neu starten, Sprache und Ton ändern. „?“ öffnet die Hilfe."
      ],
      "altar": [
        "Der Altar",
        "Nach 20 Phasen von je einer Minute erscheint der Altar auf der Minikarte. Bleibe zwei Sekunden im Kreis, um abzuschließen. Nach fünf Zusatzminuten kommt der Drache automatisch."
      ],
      "restart": [
        "Neuer Lauf",
        "Beginne bei Phase eins. Permanente Verbesserungen und ungenutzte Ladungen bleiben erhalten."
      ],
      "resume": [
        "Fortsetzen",
        "Setze denselben Kampf fort. Während der Pause vergeht keine Phasenzeit."
      ]
    }
  },
  "it": {
    "ui": {
      "play": "GIOCA",
      "resume": "CONTINUA",
      "restart": "NUOVA PARTITA",
      "pause": "Pausa",
      "language": "Lingua",
      "tagline": "Sopravvivi a 20 fasi. Equipaggiati. Raggiungi il finale.",
      "gotit": "Capito",
      "skip": "Salta tutorial",
      "replay": "Ripeti tutorial",
      "guide": "Guida al gioco",
      "close": "Chiudi ✕",
      "saveError": "Impossibile salvare la lingua.",
      "saveTutorial": "Impossibile salvare il tutorial.",
      "soundOn": "Attiva audio",
      "soundOff": "Disattiva audio",
      "soundHost": "Audio disattivato dalla piattaforma",
      "saveSound": "Impossibile salvare l'audio.",
      "stage": "Fase",
      "level": "Livello",
      "defeated": "Sconfitti",
      "mainMenu": "MENU PRINCIPALE",
      "newRun": "NUOVA PARTITA"
    },
    "tips": {
      "welcome": [
        "Benvenuto!",
        "Premi Gioca. I suggerimenti compaiono gradualmente e il combattimento si ferma mentre leggi."
      ],
      "move": [
        "Muoviti e schiva",
        "Trascina il dito nell'arena o muovi il mouse. L'eroe ti segue e spara automaticamente. Premi Capito e allontanati dai nemici rossi."
      ],
      "health": [
        "Salute ed esperienza",
        "Salute e barra XP sono in alto a sinistra. I nemici sconfitti danno subito XP. Non farti circondare."
      ],
      "upgrade": [
        "Potenzia l'eroe",
        "Scegli una carta per migliorare eroe, arma o compagno. L'XP aumenta il livello; il tempo fa avanzare le fasi."
      ],
      "item": [
        "Usa un oggetto",
        "Il pulsante in basso a destra o Spazio usa mina, granata o ghiaccio. L'oggetto viene consumato."
      ],
      "ultimate": [
        "Abilità suprema",
        "Premi il fulmine, tocca due volte l'arena o allarga due dita. Dopo l'uso l'abilità si ricarica."
      ],
      "inventory": [
        "Riserva di abilità",
        "I forzieri rari danno casualmente un attacco aereo, nebbia tossica o carro armato. Ogni uso consuma una carica. Le altre restano dopo la morte o l'uscita."
      ],
      "menu": [
        "Menu e aiuto",
        "Pausa in alto a sinistra: riprendi, ricomincia, cambia lingua e audio. «?» apre la guida."
      ],
      "altar": [
        "L'altare",
        "Dopo 20 fasi da un minuto appare l'altare sulla minimappa. Resta due secondi nel cerchio per finire. Dopo cinque minuti extra, il drago arriva automaticamente."
      ],
      "restart": [
        "Nuova partita",
        "Riparti dalla prima fase. Restano i potenziamenti permanenti e le cariche inutilizzate."
      ],
      "resume": [
        "Continua",
        "Riprendi lo stesso combattimento. Il tempo delle fasi non avanza durante la pausa."
      ]
    }
  },
  "pl": {
    "ui": {
      "play": "GRAJ",
      "resume": "KONTYNUUJ",
      "restart": "NOWA GRA",
      "pause": "Pauza",
      "language": "Język",
      "tagline": "Przetrwaj 20 etapów. Zdobądź sprzęt. Dotrzyj do finału.",
      "gotit": "Rozumiem",
      "skip": "Pomiń samouczek",
      "replay": "Powtórz samouczek",
      "guide": "Poradnik gry",
      "close": "Zamknij ✕",
      "saveError": "Nie udało się zapisać języka.",
      "saveTutorial": "Nie udało się zapisać samouczka.",
      "soundOn": "Włącz dźwięk",
      "soundOff": "Wyłącz dźwięk",
      "soundHost": "Platforma wyłączyła dźwięk",
      "saveSound": "Nie udało się zapisać dźwięku.",
      "stage": "Etap",
      "level": "Poziom",
      "defeated": "Pokonani",
      "mainMenu": "MENU GŁÓWNE",
      "newRun": "NOWA ROZGRYWKA"
    },
    "tips": {
      "welcome": [
        "Witaj!",
        "Naciśnij Graj. Wskazówki pojawiają się stopniowo. Walka jest wstrzymana, gdy je czytasz."
      ],
      "move": [
        "Ruszaj się i unikaj",
        "Przeciągaj palcem po arenie lub poruszaj myszą. Bohater podąża za tobą i strzela automatycznie. Naciśnij Rozumiem i odsuń się od czerwonych wrogów."
      ],
      "health": [
        "Zdrowie i doświadczenie",
        "Zdrowie i pasek PD są w lewym górnym rogu. Pokonani wrogowie dają PD natychmiast. Nie daj się otoczyć."
      ],
      "upgrade": [
        "Ulepsz bohatera",
        "Wybierz kartę ulepszającą bohatera, broń lub towarzysza. PD zwiększają poziom; etapy postępują z czasem."
      ],
      "item": [
        "Użyj przedmiotu",
        "Przycisk w prawym dolnym rogu lub Spacja używa miny, granatu albo lodu. Przedmiot zostaje zużyty."
      ],
      "ultimate": [
        "Umiejętność specjalna",
        "Naciśnij błyskawicę, dotknij areny dwa razy lub rozsuń dwa palce. Po użyciu umiejętność ładuje się ponownie."
      ],
      "inventory": [
        "Zapas umiejętności",
        "Rzadkie skrzynie dają losowo nalot, toksyczną mgłę lub czołg. Każde użycie zużywa ładunek. Pozostałe zachowujesz po śmierci i wyjściu."
      ],
      "menu": [
        "Menu i pomoc",
        "Pauza w lewym górnym rogu: wznów, zacznij od nowa, zmień język i dźwięk. „?” otwiera pomoc."
      ],
      "altar": [
        "Ołtarz",
        "Po 20 jednominutowych etapach ołtarz pojawia się na minimapie. Pozostań dwie sekundy w kręgu, by zakończyć. Po pięciu dodatkowych minutach smok przyleci automatycznie."
      ],
      "restart": [
        "Nowa gra",
        "Zacznij od pierwszego etapu. Stałe ulepszenia i niewykorzystane ładunki pozostają."
      ],
      "resume": [
        "Kontynuuj",
        "Wracasz do tej samej walki. Czas etapów nie płynie podczas pauzy."
      ]
    }
  },
  "tr": {
    "ui": {
      "play": "OYNA",
      "resume": "DEVAM ET",
      "restart": "YENİ OYUN",
      "pause": "Duraklatıldı",
      "language": "Dil",
      "tagline": "20 aşamada hayatta kal. Donanımını geliştir. Finale ulaş.",
      "gotit": "Anladım",
      "skip": "Eğitimi atla",
      "replay": "Eğitimi tekrarla",
      "guide": "Oyun rehberi",
      "close": "Kapat ✕",
      "saveError": "Dil kaydedilemedi.",
      "saveTutorial": "Eğitim kaydedilemedi.",
      "soundOn": "Sesi aç",
      "soundOff": "Sesi kapat",
      "soundHost": "Platform sesi kapattı",
      "saveSound": "Ses ayarı kaydedilemedi.",
      "stage": "Aşama",
      "level": "Seviye",
      "defeated": "Yenilen",
      "mainMenu": "ANA MENÜ",
      "newRun": "YENİ OYUN"
    },
    "tips": {
      "welcome": [
        "Hoş geldin!",
        "Oyna'ya bas. İpuçları sırayla görünür; okurken savaş duraklar."
      ],
      "move": [
        "Hareket et ve kaçın",
        "Parmağını arenada sürükle veya fareyi hareket ettir. Kahraman seni takip eder ve otomatik ateş eder. Anladım'a basıp kırmızı düşmanlardan uzaklaş."
      ],
      "health": [
        "Can ve deneyim",
        "Can ve XP çubuğu sol üsttedir. Yenilen düşmanlar anında XP verir. Etrafını sarmalarına izin verme."
      ],
      "upgrade": [
        "Kahramanını geliştir",
        "Kahramanı, silahı veya savaş dostunu geliştiren bir kart seç. XP seviyeyi artırır; aşamalar zamana göre ilerler."
      ],
      "item": [
        "Eşya kullan",
        "Sağ alttaki düğme veya Boşluk tuşu mayın, el bombası ya da buzu kullanır. Eşya tüketilir."
      ],
      "ultimate": [
        "Özel güç",
        "Şimşeğe bas, arenaya çift dokun veya iki parmağını ayır. Kullanımdan sonra güç yeniden dolar."
      ],
      "inventory": [
        "Yetenek stoğu",
        "Nadir sandıklar rastgele hava saldırısı, zehirli sis veya tank verir. Her kullanım bir hak tüketir. Kalan haklar ölünce veya çıkınca korunur."
      ],
      "menu": [
        "Menü ve yardım",
        "Sol üstte duraklat: devam et, yeniden başla, dil ve sesi değiştir. «?» rehberi açar."
      ],
      "altar": [
        "Sunak",
        "Birer dakikalık 20 aşamadan sonra sunak mini haritada görünür. Bitirmek için çemberde iki saniye kal. Beş ek dakika sonra ejderha kendiliğinden gelir."
      ],
      "restart": [
        "Yeni oyun",
        "İlk aşamadan başla. Kalıcı geliştirmeler ve kullanılmayan haklar korunur."
      ],
      "resume": [
        "Devam et",
        "Aynı savaşa dön. Duraklatma sırasında aşama süresi ilerlemez."
      ]
    }
  },
  "id": {
    "ui": {
      "play": "MAIN",
      "resume": "LANJUTKAN",
      "restart": "PERMAINAN BARU",
      "pause": "Jeda",
      "language": "Bahasa",
      "tagline": "Bertahan selama 20 tahap. Siapkan perlengkapan. Capai final.",
      "gotit": "Mengerti",
      "skip": "Lewati tutorial",
      "replay": "Ulangi tutorial",
      "guide": "Panduan permainan",
      "close": "Tutup ✕",
      "saveError": "Bahasa tidak dapat disimpan.",
      "saveTutorial": "Tutorial tidak dapat disimpan.",
      "soundOn": "Aktifkan suara",
      "soundOff": "Matikan suara",
      "soundHost": "Suara dimatikan oleh platform",
      "saveSound": "Pengaturan suara tidak dapat disimpan.",
      "stage": "Tahap",
      "level": "Level",
      "defeated": "Dikalahkan",
      "mainMenu": "MENU UTAMA",
      "newRun": "PERMAINAN BARU"
    },
    "tips": {
      "welcome": [
        "Selamat datang!",
        "Tekan Main. Petunjuk muncul secara bertahap; pertempuran dijeda saat kamu membacanya."
      ],
      "move": [
        "Bergerak dan menghindar",
        "Seret jari di arena atau gerakkan mouse. Pahlawan mengikuti dan menembak otomatis. Tekan Mengerti, lalu jauhi musuh merah."
      ],
      "health": [
        "Nyawa dan pengalaman",
        "Nyawa dan bar XP ada di kiri atas. Musuh yang dikalahkan langsung memberi XP. Jangan sampai terkepung."
      ],
      "upgrade": [
        "Tingkatkan pahlawan",
        "Pilih kartu untuk meningkatkan pahlawan, senjata, atau teman tempur. XP menaikkan level; waktu memajukan tahap."
      ],
      "item": [
        "Gunakan benda",
        "Tombol kanan bawah atau Spasi memakai ranjau, granat, atau es. Benda akan habis setelah dipakai."
      ],
      "ultimate": [
        "Kemampuan pamungkas",
        "Tekan petir, ketuk arena dua kali, atau renggangkan dua jari. Kemampuan terisi kembali setelah digunakan."
      ],
      "inventory": [
        "Persediaan kemampuan",
        "Peti langka memberi serangan udara, kabut beracun, atau tank secara acak. Tiap pemakaian menghabiskan satu jatah. Sisanya tersimpan setelah mati atau keluar."
      ],
      "menu": [
        "Menu dan bantuan",
        "Jeda di kiri atas: lanjutkan, mulai ulang, ubah bahasa dan suara. «?» membuka panduan."
      ],
      "altar": [
        "Altar",
        "Setelah 20 tahap masing-masing satu menit, altar muncul di peta mini. Bertahan dua detik di lingkaran untuk selesai. Setelah lima menit tambahan, naga datang otomatis."
      ],
      "restart": [
        "Permainan baru",
        "Mulai dari tahap pertama. Peningkatan permanen dan persediaan yang belum dipakai tetap tersimpan."
      ],
      "resume": [
        "Lanjutkan",
        "Kembali ke pertempuran yang sama. Waktu tahap tidak berjalan selama jeda."
      ]
    }
  },
  "hi": {
    "ui": {
      "play": "खेलें",
      "resume": "जारी रखें",
      "restart": "नया खेल",
      "pause": "विराम",
      "language": "भाषा",
      "tagline": "20 चरणों में जीवित रहो। उपकरण जुटाओ। अंतिम चरण तक पहुँचो।",
      "gotit": "समझ गया",
      "skip": "प्रशिक्षण छोड़ें",
      "replay": "प्रशिक्षण दोहराएँ",
      "guide": "खेल की मार्गदर्शिका",
      "close": "बंद करें ✕",
      "saveError": "भाषा सहेजी नहीं जा सकी।",
      "saveTutorial": "प्रशिक्षण सहेजा नहीं जा सका।",
      "soundOn": "आवाज़ चालू करें",
      "soundOff": "आवाज़ बंद करें",
      "soundHost": "प्लैटफ़ॉर्म ने आवाज़ बंद की है",
      "saveSound": "आवाज़ की सेटिंग सहेजी नहीं जा सकी।",
      "stage": "चरण",
      "level": "स्तर",
      "defeated": "हराए गए",
      "mainMenu": "मुख्य मेनू",
      "newRun": "नया खेल"
    },
    "tips": {
      "welcome": [
        "स्वागत है!",
        "खेलें दबाएँ। सुझाव धीरे-धीरे दिखाई देंगे। उन्हें पढ़ते समय लड़ाई रुकी रहेगी।"
      ],
      "move": [
        "चलें और बचें",
        "अखाड़े पर उँगली खींचें या माउस चलाएँ। नायक आपका पीछा करता है और अपने-आप गोली चलाता है। समझ गया दबाएँ और लाल दुश्मनों से दूर जाएँ।"
      ],
      "health": [
        "सेहत और अनुभव",
        "ऊपर बाईं ओर सेहत और XP की पट्टी है। दुश्मन हराते ही XP मिलता है। खुद को घिरने न दें।"
      ],
      "upgrade": [
        "नायक को बेहतर बनाएँ",
        "नायक, हथियार या लड़ाई के साथी को बेहतर बनाने वाला कार्ड चुनें। XP से स्तर बढ़ता है; समय से चरण आगे बढ़ते हैं।"
      ],
      "item": [
        "वस्तु इस्तेमाल करें",
        "नीचे दाईं ओर का बटन या स्पेस दबाकर बारूदी सुरंग, ग्रेनेड या बर्फ इस्तेमाल करें। वस्तु खर्च हो जाती है।"
      ],
      "ultimate": [
        "विशेष शक्ति",
        "बिजली का बटन दबाएँ, अखाड़े पर दो बार टैप करें या दो उँगलियाँ फैलाएँ। इस्तेमाल के बाद शक्ति फिर भरती है।"
      ],
      "inventory": [
        "क्षमताओं का भंडार",
        "दुर्लभ संदूक से हवाई हमला, जहरीली धुंध या टैंक का एक यादृच्छिक चार्ज मिलता है। हर इस्तेमाल में एक खर्च होता है। बचे चार्ज मरने या बाहर जाने पर सुरक्षित रहते हैं।"
      ],
      "menu": [
        "मेन्यू और मदद",
        "ऊपर बाएँ विराम बटन है: खेल जारी रखो, फिर शुरू करो या भाषा और ध्वनि बदलो। «?» से गाइड खुलेगी।"
      ],
      "altar": [
        "वेदी",
        "एक-एक मिनट के 20 चरणों के बाद छोटे नक्शे पर वेदी आती है। खेल पूरा करने के लिए घेरे में दो सेकंड रहें। पाँच अतिरिक्त मिनटों के बाद ड्रैगन अपने-आप आता है।"
      ],
      "restart": [
        "नया खेल",
        "पहले चरण से फिर शुरू करो। स्थायी सुधार और बची हुई क्षमताएँ सुरक्षित रहेंगी।"
      ],
      "resume": [
        "जारी रखें",
        "उसी लड़ाई में लौटें। विराम के दौरान चरणों का समय नहीं बढ़ता।"
      ]
    }
  },
  "ja": {
    "ui": {
      "play": "プレイ",
      "resume": "続ける",
      "restart": "最初から",
      "pause": "一時停止",
      "language": "言語",
      "tagline": "20ステージを生き抜こう。装備を整え、フィナーレへ。",
      "gotit": "わかった",
      "skip": "チュートリアルをスキップ",
      "replay": "チュートリアルを再開",
      "guide": "ゲームガイド",
      "close": "閉じる ✕",
      "saveError": "言語設定を保存できませんでした。",
      "saveTutorial": "チュートリアルを保存できませんでした。",
      "soundOn": "音をオン",
      "soundOff": "音をオフ",
      "soundHost": "プラットフォームが音をオフにしています",
      "saveSound": "音の設定を保存できませんでした。",
      "stage": "ステージ",
      "level": "レベル",
      "defeated": "撃破数",
      "mainMenu": "メインメニュー",
      "newRun": "新しく始める"
    },
    "tips": {
      "welcome": [
        "ようこそ！",
        "プレイを押そう。状況に合わせてヒントが表示されるよ。読んでいる間は戦闘が止まる。"
      ],
      "move": [
        "動いてよけよう",
        "アリーナで指をドラッグするかマウスを動かそう。ヒーローが追いかけ、自動で射撃する。わかったを押して赤い敵から離れよう。"
      ],
      "health": [
        "体力と経験値",
        "左上に体力とXPバーがある。敵を倒すとすぐにXPが入る。囲まれないように動こう。"
      ],
      "upgrade": [
        "ヒーローを強化",
        "カードを選んでヒーロー、武器、戦闘ペットを強化しよう。XPでレベルが上がり、時間でステージが進む。"
      ],
      "item": [
        "アイテムを使おう",
        "右下のボタンかスペースキーで地雷、手榴弾、氷を使える。使うとアイテムはなくなる。"
      ],
      "ultimate": [
        "必殺技",
        "稲妻を押すか、アリーナをダブルタップするか、2本の指を広げよう。使った後は再びチャージされる。"
      ],
      "inventory": [
        "スキルのストック",
        "レア宝箱から空爆、毒霧、戦車のいずれかをランダムに1回分入手。使うと1回分を消費する。未使用分は死亡や終了後も残る。"
      ],
      "menu": [
        "メニューとヘルプ",
        "左上で一時停止。再開、やり直し、言語・音の変更ができます。「?」でガイドを開きます。"
      ],
      "altar": [
        "祭壇",
        "各1分の20ステージ後、ミニマップに祭壇が現れる。円の中に2秒いると終了できる。追加の5分が過ぎるとドラゴンが自動で来る。"
      ],
      "restart": [
        "最初から",
        "ステージ1からやり直します。永続強化と未使用の能力は保持されます。"
      ],
      "resume": [
        "続ける",
        "同じ戦闘に戻る。一時停止中はステージの時間が進まない。"
      ]
    }
  },
  "ko": {
    "ui": {
      "play": "플레이",
      "resume": "계속하기",
      "restart": "새 게임",
      "pause": "일시 정지",
      "language": "언어",
      "tagline": "20개 스테이지에서 살아남으세요. 장비를 갖추고 마지막까지!",
      "gotit": "알겠어요",
      "skip": "튜토리얼 건너뛰기",
      "replay": "튜토리얼 다시 보기",
      "guide": "게임 안내",
      "close": "닫기 ✕",
      "saveError": "언어를 저장하지 못했습니다.",
      "saveTutorial": "튜토리얼을 저장하지 못했습니다.",
      "soundOn": "소리 켜기",
      "soundOff": "소리 끄기",
      "soundHost": "플랫폼에서 소리를 껐습니다",
      "saveSound": "소리 설정을 저장하지 못했습니다.",
      "stage": "스테이지",
      "level": "레벨",
      "defeated": "처치",
      "mainMenu": "메인 메뉴",
      "newRun": "새 게임"
    },
    "tips": {
      "welcome": [
        "환영해요!",
        "플레이를 누르세요. 상황에 맞춰 안내가 나옵니다. 읽는 동안 전투가 멈춥니다."
      ],
      "move": [
        "움직이고 피하세요",
        "경기장에서 손가락을 끌거나 마우스를 움직이세요. 영웅이 따라가며 자동으로 사격합니다. 알겠어요를 누르고 빨간 적에게서 벗어나세요."
      ],
      "health": [
        "체력과 경험치",
        "왼쪽 위에 체력과 XP 막대가 있습니다. 적을 처치하면 즉시 XP를 얻습니다. 포위되지 않게 움직이세요."
      ],
      "upgrade": [
        "영웅 강화",
        "카드를 골라 영웅, 무기, 전투 펫을 강화하세요. XP로 레벨이 오르고 시간에 따라 스테이지가 진행됩니다."
      ],
      "item": [
        "아이템 사용",
        "오른쪽 아래 버튼이나 스페이스로 지뢰, 수류탄, 얼음을 사용합니다. 사용하면 아이템이 소모됩니다."
      ],
      "ultimate": [
        "궁극기",
        "번개를 누르거나 경기장을 두 번 탭하거나 두 손가락을 벌리세요. 사용 후 다시 충전됩니다."
      ],
      "inventory": [
        "능력 보관함",
        "희귀 상자는 공습, 독 안개, 탱크 중 하나를 무작위로 줍니다. 사용할 때마다 1회분이 소모됩니다. 남은 수량은 죽거나 나가도 유지됩니다."
      ],
      "menu": [
        "메뉴와 도움말",
        "왼쪽 위에서 일시 정지: 계속하기, 다시 시작, 언어와 소리를 설정할 수 있어요. «?»는 도움말입니다."
      ],
      "altar": [
        "제단",
        "각 1분인 20스테이지 후 미니맵에 제단이 나타납니다. 원 안에 2초 머물면 끝낼 수 있습니다. 추가 5분이 지나면 드래곤이 자동으로 옵니다."
      ],
      "restart": [
        "새 게임",
        "첫 스테이지부터 다시 시작합니다. 영구 강화와 사용하지 않은 능력은 유지됩니다."
      ],
      "resume": [
        "계속하기",
        "같은 전투로 돌아갑니다. 일시 정지 중에는 스테이지 시간이 흐르지 않습니다."
      ]
    }
  },
  "zh": {
    "ui": {
      "play": "开始游戏",
      "resume": "继续",
      "restart": "重新开始",
      "pause": "暂停",
      "language": "语言",
      "tagline": "生存20个阶段，强化装备，抵达最终战！",
      "gotit": "明白了",
      "skip": "跳过教程",
      "replay": "重看教程",
      "guide": "游戏指南",
      "close": "关闭 ✕",
      "saveError": "无法保存语言设置。",
      "saveTutorial": "无法保存教程进度。",
      "soundOn": "开启声音",
      "soundOff": "关闭声音",
      "soundHost": "平台已关闭声音",
      "saveSound": "无法保存声音设置。",
      "stage": "阶段",
      "level": "等级",
      "defeated": "击败",
      "mainMenu": "主菜单",
      "newRun": "新一局"
    },
    "tips": {
      "welcome": [
        "欢迎！",
        "点击开始游戏。提示会逐步出现，阅读时战斗会暂停。"
      ],
      "move": [
        "移动和躲避",
        "在场地上拖动手指或移动鼠标。英雄会跟随并自动射击。点击明白了，然后远离红色敌人。"
      ],
      "health": [
        "生命和经验",
        "左上方是生命和XP条。击败敌人会立即获得XP。保持移动，避免被包围。"
      ],
      "upgrade": [
        "强化英雄",
        "选择卡牌来强化英雄、武器或战斗宠物。XP提升等级，时间推动阶段。"
      ],
      "item": [
        "使用道具",
        "点击右下按钮或按空格使用地雷、手榴弹或冰。道具使用后会消耗。"
      ],
      "ultimate": [
        "终极技能",
        "点击闪电、双击场地或用双指向外张开。使用后技能会重新充能。"
      ],
      "inventory": [
        "技能库存",
        "稀有宝箱随机给予空袭、毒雾或坦克的一次使用次数。每次使用消耗一次，剩余次数在死亡或退出后保留。"
      ],
      "menu": [
        "菜单和帮助",
        "左上角暂停：继续、重新开始、设置语言与声音。「?」打开指南。"
      ],
      "altar": [
        "祭坛",
        "完成20个各一分钟的阶段后，小地图上会出现祭坛。在圆圈内停留两秒即可结束。再过五分钟，龙会自动到来。"
      ],
      "restart": [
        "重新开始",
        "从第一阶段重新开始。永久强化和未使用的能力次数会保留。"
      ],
      "resume": [
        "继续",
        "回到同一场战斗。暂停时阶段计时不会前进。"
      ]
    }
  },
  "ar": {
    "ui": {
      "play": "العب",
      "resume": "متابعة",
      "restart": "لعبة جديدة",
      "pause": "إيقاف مؤقت",
      "language": "اللغة",
      "tagline": "انجُ في 20 مرحلة. جهّز معداتك. بلّغ النهاية.",
      "gotit": "فهمت",
      "skip": "تخطي التدريب",
      "replay": "إعادة التدريب",
      "guide": "دليل اللعبة",
      "close": "إغلاق ✕",
      "saveError": "تعذر حفظ اللغة.",
      "saveTutorial": "تعذر حفظ التدريب.",
      "soundOn": "تشغيل الصوت",
      "soundOff": "كتم الصوت",
      "soundHost": "المنصة أوقفت الصوت",
      "saveSound": "تعذر حفظ إعداد الصوت.",
      "stage": "المرحلة",
      "level": "المستوى",
      "defeated": "المهزومون",
      "mainMenu": "القائمة الرئيسية",
      "newRun": "جولة جديدة"
    },
    "tips": {
      "welcome": [
        "أهلًا بك!",
        "اضغط العب. ستظهر الإرشادات تدريجيًا، ويتوقف القتال أثناء قراءتها."
      ],
      "move": [
        "تحرك وتفادَ الأعداء",
        "اسحب إصبعك على الساحة أو حرك الفأرة. يتبعك البطل ويطلق النار تلقائيًا. اضغط فهمت ثم ابتعد عن الأعداء الحمر."
      ],
      "health": [
        "الصحة والخبرة",
        "الصحة وشريط XP في أعلى اليسار. تحصل على الخبرة فور هزيمة الأعداء. لا تسمح لهم بمحاصرتك."
      ],
      "upgrade": [
        "طوّر بطلك",
        "اختر بطاقة لتحسين البطل أو السلاح أو رفيق القتال. الخبرة ترفع المستوى، والوقت يقدّم المراحل."
      ],
      "item": [
        "استخدم أداة",
        "الزر أسفل اليمين أو مفتاح المسافة يستخدم اللغم أو القنبلة أو الجليد. تُستهلك الأداة عند استخدامها."
      ],
      "ultimate": [
        "القدرة الخارقة",
        "اضغط البرق أو انقر الساحة مرتين أو باعد بين إصبعين. تُشحن القدرة من جديد بعد استخدامها."
      ],
      "inventory": [
        "مخزون القدرات",
        "تعطي الصناديق النادرة غارة جوية أو ضبابًا سامًا أو دبابة عشوائيًا. كل استعمال يستهلك شحنة. تبقى الشحنات غير المستخدمة بعد الموت أو الخروج."
      ],
      "menu": [
        "القائمة والمساعدة",
        "زر الإيقاف أعلى اليسار: متابعة أو بدء جديد أو تغيير اللغة والصوت. «؟» يفتح الدليل."
      ],
      "altar": [
        "المذبح",
        "بعد 20 مرحلة مدة كل منها دقيقة يظهر المذبح على الخريطة المصغرة. ابقَ ثانيتين داخل الدائرة لإنهاء اللعب. بعد خمس دقائق إضافية يأتي التنين تلقائيًا."
      ],
      "restart": [
        "لعبة جديدة",
        "ابدأ من المرحلة الأولى. تبقى الترقيات الدائمة والشحنات غير المستخدمة."
      ],
      "resume": [
        "متابعة",
        "عد إلى القتال نفسه. لا يتقدم وقت المراحل أثناء الإيقاف المؤقت."
      ]
    }
  }
};
const CAMP_LABELS={
 es:["Mejor etapa","Toca al héroe, al perro, el armero o el cofre"],
 pt:["Melhor fase","Toque no herói, no cão, no suporte de armas ou no baú"],
 fr:["Meilleure étape","Touche le héros, le chien, le râtelier ou le coffre"],
 de:["Beste Stufe","Tippe auf Held, Hund, Waffenständer oder Truhe"],
 it:["Migliore fase","Tocca l'eroe, il cane, la rastrelliera o il forziere"],
 pl:["Najlepszy etap","Dotknij bohatera, psa, stojaka na broń lub skrzyni"],
 tr:["En iyi aşama","Kahramana, köpeğe, silahlığa veya sandığa dokun"],
 id:["Tahap terbaik","Ketuk pahlawan, anjing, rak senjata, atau peti"],
 hi:["सर्वश्रेष्ठ चरण","नायक, कुत्ते, हथियारों के स्टैंड या संदूक को छुएँ"],
 ja:["最高ステージ","主人公、犬、武器ラック、宝箱をタップ"],
 ko:["최고 스테이지","영웅, 강아지, 무기 거치대 또는 상자를 터치하세요"],
 zh:["最高关卡","点击英雄、小狗、武器架或宝箱"],
 ar:["أفضل مرحلة","اضغط على البطل أو الكلب أو حامل الأسلحة أو الصندوق"]
};
for(const [lang,[bestStage,campHint]] of Object.entries(CAMP_LABELS))Object.assign(LANGUAGE_PACKS[lang].ui,{bestStage,campHint});
const BOSS_RULES={
 ru:'Обычные стадии длятся минуту. На 5, 10, 15 и 20-й стадиях наступает ночь: победи босса, чтобы пройти дальше. Следи за отметками атак. Драконы иногда помогают, но победа в забеге — только после последнего босса.',
 en:'Normal stages last one minute. Stages 5, 10, 15 and 20 turn to night: defeat the boss to advance. Watch attack markers. Dragons occasionally help, but only defeating the final boss wins the run.',
 es:'Las etapas normales duran un minuto. En las etapas 5, 10, 15 y 20 llega la noche: derrota al jefe para avanzar. Evita las zonas de ataque. Los dragones ayudan a veces; solo derrotar al último jefe termina la partida.',
 pt:'As fases normais duram um minuto. Nas fases 5, 10, 15 e 20 anoitece: derrote o chefe para avançar. Evite as áreas marcadas. Dragões ajudam às vezes; vencer o último chefe encerra a partida.',
 fr:'Les étapes normales durent une minute. Aux étapes 5, 10, 15 et 20, la nuit tombe : bats le boss pour avancer. Évite les zones marquées. Les dragons aident parfois ; seul le dernier boss vaincu termine la partie.',
 de:'Normale Stufen dauern eine Minute. In Stufe 5, 10, 15 und 20 wird es Nacht: Besiege den Boss, um weiterzukommen. Meide markierte Angriffe. Drachen helfen gelegentlich. Erst der Sieg über den letzten Boss beendet den Lauf.',
 it:'Le fasi normali durano un minuto. Nelle fasi 5, 10, 15 e 20 arriva la notte: sconfiggi il boss per avanzare. Evita le zone segnate. I draghi aiutano a volte; solo l’ultimo boss sconfitto conclude la partita.',
 pl:'Zwykłe etapy trwają minutę. Na etapach 5, 10, 15 i 20 zapada noc: pokonaj bossa, aby przejść dalej. Unikaj oznaczonych ataków. Smoki czasami pomagają. Dopiero pokonanie ostatniego bossa kończy rozgrywkę.',
 tr:'Normal aşamalar bir dakika sürer. 5, 10, 15 ve 20. aşamalarda gece olur: ilerlemek için bossu yen. İşaretli saldırılardan kaçın. Ejderhalar bazen yardım eder; yalnızca son bossu yenmek oyunu bitirir.',
 id:'Tahap biasa berlangsung satu menit. Tahap 5, 10, 15, dan 20 menjadi malam: kalahkan bos untuk lanjut. Hindari tanda serangan. Naga kadang membantu; hanya mengalahkan bos terakhir yang memenangkan permainan.',
 hi:'सामान्य चरण एक मिनट के हैं। चरण 5, 10, 15 और 20 में रात होती है: आगे बढ़ने के लिए बॉस को हराएँ। हमले के निशानों से बचें। ड्रैगन कभी-कभी मदद करते हैं; अंतिम बॉस को हराने पर ही जीत होती है।',
 ja:'通常ステージは1分間です。5・10・15・20では夜になり、ボスを倒すまで進めません。攻撃の予告を避けましょう。ドラゴンが時々助けてくれますが、最後のボスを倒すとクリアです。',
 ko:'일반 스테이지는 1분입니다. 5, 10, 15, 20 스테이지에는 밤이 되며 보스를 쓰러뜨려야 진행됩니다. 공격 표시를 피하세요. 드래곤이 가끔 도와주지만 마지막 보스를 물리쳐야 승리합니다.',
 zh:'普通关卡持续一分钟。第5、10、15、20关进入夜晚，击败首领才能继续。注意躲避攻击预警。龙偶尔前来助战，但只有击败最终首领才能获胜。',
 ar:'تدوم المراحل العادية دقيقة. يحل الليل في المراحل 5 و10 و15 و20: اهزم الزعيم للتقدم وتجنب علامات الهجوم. تساعد التنانين أحيانًا، لكن هزيمة الزعيم الأخير فقط تنهي الجولة بالنصر.'
};
for(const [lang,pack] of Object.entries(LANGUAGE_PACKS))pack.tips.altar=['5 · 10 · 15 · 20',BOSS_RULES[lang]||BOSS_RULES.en];
const SETTINGS_NAMES={es:'Ajustes',pt:'Configurações',fr:'Paramètres',de:'Einstellungen',it:'Impostazioni',pl:'Ustawienia',tr:'Ayarlar',id:'Pengaturan',hi:'सेटिंग्स',ja:'設定',ko:'설정',zh:'设置',ar:'الإعدادات'};
for(const [lang,label] of Object.entries(SETTINGS_NAMES))LANGUAGE_PACKS[lang].ui.settings=label;
