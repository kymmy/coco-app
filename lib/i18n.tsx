"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type Locale = "fr" | "en";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, ...args: (string | number)[]) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "fr",
  setLocale: () => {},
  t: (key) => key,
});

// ---------------------------------------------------------------------------
// French translations
// ---------------------------------------------------------------------------
const fr: Record<string, string> = {
  // Navigation
  "nav.groups": "Groupes",
  "nav.events": "Sorties",
  "nav.settings": "Reglages",
  "nav.create": "+ Creer",

  // Hero
  "hero.badge": "Pour les parents d\u2019\u00e9l\u00e8ves \ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d\udc66",
  "hero.title": "Organisez les sorties entre parents de l\u2019\u00e9cole ",
  "hero.titleAccent": "en 1 minute.",
  "hero.subtitle": "Fini les 42 messages WhatsApp pour trouver une date. Proposez, rassemblez, profitez. \ud83c\udf89",
  "hero.ctaJoin": "Rejoindre les parents de l\u2019\u00e9cole",
  "hero.ctaCreate": "Cr\u00e9er une sortie",

  // Why section
  "why.title": "Organiser une sortie, c\u2019est pas cens\u00e9 \u00eatre compliqu\u00e9 \ud83e\udd2f",
  "why.subtitle": "Pourtant, entre les parents, \u00e7a l\u2019est toujours.",
  "why.pain1Title": "Trop de messages",
  "why.pain1Desc": "Les groupes WhatsApp qui d\u00e9bordent pour caler un simple go\u00fbter au parc.",
  "why.pain2Title": "Impossible de trouver une date",
  "why.pain2Desc": "Entre le judo, la danse et les week-ends chez mamie, trouver un cr\u00e9neau est un casse-t\u00eate.",
  "why.pain3Title": "On conna\u00eet peu de parents",
  "why.pain3Desc": "Difficile d\u2019organiser quand on ne conna\u00eet pas les autres familles de la classe.",
  "why.pain4Title": "Toujours les m\u00eames qui organisent",
  "why.pain4Desc": "La charge mentale retombe toujours sur 2-3 parents motiv\u00e9s. Ce n\u2019est pas tenable.",
  "why.cocoIs": "Coco, c\u2019est {0}, {1}, {2} et {3}. Juste ce qu\u2019il faut pour se retrouver.",
  "why.simple": "simple",
  "why.local": "local",
  "why.private": "priv\u00e9",
  "why.frictionless": "sans friction",

  // How it works
  "how.title": "Comment \u00e7a marche\u00a0? \ud83e\udde9",
  "how.subtitle": "3 \u00e9tapes, z\u00e9ro prise de t\u00eate.",
  "how.step1Title": "Cr\u00e9ez ou rejoignez un groupe",
  "how.step1Desc": "Cr\u00e9ez un groupe pour votre \u00e9cole ou classe et partagez le code d\u2019invitation avec les autres parents.",
  "how.step2Title": "Proposez une sortie",
  "how.step2Desc": "Parc, go\u00fbter, mus\u00e9e, piscine\u2026 Cr\u00e9ez une sortie en quelques secondes et les parents du groupe sont pr\u00e9venus.",
  "how.step3Title": "Organisez-vous ensemble",
  "how.step3Desc": "Inscrivez-vous, pr\u00e9cisez qui apporte quoi, recevez un rappel la veille. Vous n\u2019avez plus qu\u2019\u00e0 en profiter !",

  // Community
  "community.title": "Une communaut\u00e9 de confiance \ud83e\udd1d",
  "community.subtitle": "Coco cr\u00e9e un espace s\u00fbr et chaleureux pour les parents de votre \u00e9cole.",
  "community.bullet1Title": "Priv\u00e9 par d\u00e9faut",
  "community.bullet1Desc": "Seuls les parents de l\u2019\u00e9cole peuvent voir et rejoindre les sorties.",
  "community.bullet2Title": "100% local",
  "community.bullet2Desc": "Votre \u00e9cole, votre quartier, vos voisins. Pas un r\u00e9seau social de plus.",
  "community.bullet3Title": "Aucune pub, aucun tracking",
  "community.bullet3Desc": "Vos donn\u00e9es restent les v\u00f4tres. Pas de pub, pas de revente.",
  "community.bullet4Title": "Fait pour les familles",
  "community.bullet4Desc": "Con\u00e7u par des parents, pour des parents. Simple, bienveillant, efficace.",
  "community.conclusion": "Parce que les meilleurs souvenirs d\u2019enfance se cr\u00e9ent ensemble, en toute simplicit\u00e9. \ud83c\udf08",

  // Social proof
  "social.title": "Ils n\u2019attendent que \u00e7a \ud83d\ude80",
  "social.subtitle": "Coco est en cours de cr\u00e9ation. Voici o\u00f9 nous en sommes.",
  "social.stat1Value": "150+",
  "social.stat1Label": "familles int\u00e9ress\u00e9es",
  "social.stat1Desc": "Des parents comme vous, pr\u00eats \u00e0 simplifier les sorties.",
  "social.stat2Value": "12",
  "social.stat2Label": "\u00e9coles en attente",
  "social.stat2Desc": "De la maternelle au CM2, partout en France.",
  "social.stat3Value": "100%",
  "social.stat3Label": "gratuit au lancement",
  "social.stat3Desc": "Les premiers inscrits profiteront de Coco gratuitement.",

  // Final CTA
  "cta.title1": "Simplifiez l\u2019organisation.",
  "cta.title2": "Profitez du moment avec vos enfants.",
  "cta.subtitle": "Laissez votre email pour \u00eatre pr\u00e9venu d\u00e8s le lancement. Vous recevrez aussi une invitation agenda pour ne rien manquer. \ud83d\udcec",
  "cta.thankTitle": "Merci ! Vous \u00eates sur la liste.",
  "cta.thankDesc": "On vous pr\u00e9vient d\u00e8s que Coco est pr\u00eat. \u00c0 tr\u00e8s vite !",
  "cta.errorEmail": "Veuillez entrer une adresse email valide.",
  "cta.errorDuplicate": "Cette adresse est d\u00e9j\u00e0 inscrite !",
  "cta.submit": "Je m\u2019inscris \ud83d\ude80",
  "cta.nospam": "Pas de spam, promis. Juste une notification quand c\u2019est pr\u00eat. \ud83e\udd1e",

  // Footer
  "footer.text": "Coco \u2014 Copains du coin \u00a9 {0} \u2014 Fait avec amour par des parents, pour des parents.",

  // Notification banner
  "notif.enabled": "Notifications activ\u00e9es !",
  "notif.question": "Recevoir les notifications ?",
  "notif.description": "Soyez averti des nouvelles sorties et inscriptions.",
  "notif.enable": "Activer",
  "notif.later": "Plus tard",

  // Categories
  "cat.parc": "\ud83c\udf33 Parc / Plein air",
  "cat.sport": "\u26bd Sport",
  "cat.musee": "\ud83c\udfa8 Mus\u00e9e / Expo",
  "cat.spectacle": "\ud83c\udfad Spectacle",
  "cat.restaurant": "\ud83c\udf55 Restaurant / Go\u00fbter",
  "cat.atelier": "\u2702\ufe0f Atelier / Loisir cr\u00e9atif",
  "cat.piscine": "\ud83c\udfca Piscine / Baignade",
  "cat.balade": "\ud83d\udeb6 Balade / Rando",
  "cat.autre": "\ud83d\udccc Autre",
  "cat.all": "Toutes",

  // Events page
  "events.home": "Accueil",
  "events.title": "Les sorties",
  "events.new": "+ Nouvelle",
  "events.search": "Rechercher...",
  "events.list": "Liste",
  "events.map": "Carte",
  "events.loading": "Chargement...",
  "events.joinGroup": "Rejoignez un groupe pour voir les sorties",
  "events.joinGroupDesc": "Cr\u00e9ez ou rejoignez un groupe de parents pour commencer.",
  "events.myGroups": "Mes groupes \ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d\udc66",
  "events.noEvents": "Aucune sortie pour le moment",
  "events.noEventsDesc": "Soyez le premier \u00e0 proposer une sortie !",
  "events.proposeEvent": "Proposer une sortie \ud83c\udf89",
  "events.noUpcoming": "Aucune sortie \u00e0 venir",
  "events.inCategory": " dans cette cat\u00e9gorie",
  "events.pastEvents": "Sorties pass\u00e9es",
  "events.loadingMap": "Chargement de la carte...",
  "events.past": "Pass\u00e9e",
  "events.upcoming": "A venir",
  "events.free": "Gratuit",
  "events.recurring": "R\u00e9current",
  "events.organizedBy": "Organis\u00e9 par",
  "events.participant": "participant",
  "events.participants": "participants",
  "events.full": "complet",
  "events.spotLeft": "{0} place restante",
  "events.spotsLeft": "{0} places restantes",
  "events.coming": "Pr\u00e9sents",
  "events.maybe": "Peut-\u00eatre",
  "events.cantMakeIt": "Ne peut pas",
  "events.cancelReg": "Annuler inscription",
  "events.imComing": "Je viens \u270b",
  "events.maybeComing": "Peut-\u00eatre \ud83e\udd14",
  "events.eventFull": "Cette sortie est compl\u00e8te",
  "events.firstName": "Votre pr\u00e9nom",
  "events.cancel": "Annuler",
  "events.addGCal": "Ajouter \u00e0 Google Calendar \ud83d\udcc5",
  "events.viewDetails": "Voir les d\u00e9tails",
  "events.viewLink": "Voir le lien",

  // Event detail
  "detail.allEvents": "Toutes les sorties",
  "detail.notFound": "\u00c9v\u00e9nement introuvable",
  "detail.backToEvents": "Retour aux sorties",
  "detail.share": "Partager \ud83d\udd17",
  "detail.linkCopied": "Lien copi\u00e9 \u2713",
  "detail.gCal": "Google Calendar \ud83d\udcc5",
  "detail.downloadIcs": "T\u00e9l\u00e9charger .ics \ud83d\udce5",
  "detail.edit": "Modifier \u270f\ufe0f",
  "detail.duplicate": "Dupliquer \ud83d\udccb",
  "detail.delete": "Supprimer \ud83d\uddd1\ufe0f",
  "detail.confirm": "Confirmer ?",
  "detail.yesDelete": "Oui, supprimer",
  "detail.no": "Non",
  "detail.confirmComing": "Vous confirmez votre venue \u270b",
  "detail.confirmMaybe": "Vous indiquez un peut-\u00eatre \ud83e\udd14",

  // Edit form
  "edit.title": "Titre *",
  "edit.category": "Cat\u00e9gorie",
  "edit.organizer": "Organisateur *",
  "edit.start": "D\u00e9but *",
  "edit.end": "Fin",
  "edit.location": "Lieu *",
  "edit.price": "Tarif",
  "edit.maxSpots": "Places max",
  "edit.ageMin": "\u00c2ge min",
  "edit.ageMax": "\u00c2ge max",
  "edit.description": "Description *",
  "edit.externalLink": "Lien externe",
  "edit.saving": "Enregistrement...",
  "edit.save": "Enregistrer",
  "edit.cancel": "Annuler",
  "edit.searching": "Recherche...",

  // Comments
  "comments.title": "Discussion",
  "comments.firstName": "Votre pr\u00e9nom",
  "comments.message": "Votre message...",
  "comments.send": "Envoyer",

  // Checklist
  "checklist.title": "Qui apporte quoi ?",
  "checklist.illTakeCare": "Je m\u2019en charge",
  "checklist.cancel": "Annuler",
  "checklist.placeholder": "ex: G\u00e2teau, boissons, ballon...",

  // Photos
  "photos.title": "Photos",
  "photos.uploading": "Envoi...",
  "photos.addPhoto": "Ajouter une photo \ud83d\udcf8",
  "photos.noPhotos": "Aucune photo pour le moment. Partagez vos souvenirs !",

  // Weather
  "weather.clearSky": "Ciel d\u00e9gag\u00e9",
  "weather.partlyCloudy": "Partiellement nuageux",
  "weather.fog": "Brouillard",
  "weather.drizzle": "Bruine",
  "weather.rain": "Pluie",
  "weather.snow": "Neige",
  "weather.showers": "Averses",
  "weather.snowShowers": "Averses de neige",
  "weather.thunderstorm": "Orage",
  "weather.unknown": "Inconnu",

  // Create page
  "create.back": "Retour",
  "create.duplicateTitle": "Dupliquer une sortie",
  "create.createTitle": "Proposer une sortie",
  "create.subtitle": "Remplissez les infos et partagez avec les parents !",
  "create.eventTitle": "Titre de la sortie *",
  "create.eventTitlePlaceholder": "ex: Sortie au zoo de Lyon",
  "create.firstName": "Votre pr\u00e9nom *",
  "create.firstNamePlaceholder": "ex: Sophie",
  "create.group": "Groupe",
  "create.noGroup": "Aucun groupe",
  "create.recurrence": "R\u00e9currence",
  "create.singleEvent": "\u00c9v\u00e9nement unique",
  "create.weekly": "Chaque semaine",
  "create.biweekly": "Toutes les 2 semaines",
  "create.monthly": "Chaque mois",
  "create.occurrences": "Nombre d\u2019occurrences (max 52)",
  "create.location": "Lieu *",
  "create.locationPlaceholder": "ex: Parc de la T\u00eate d\u2019Or, Lyon",
  "create.searching": "Recherche...",
  "create.price": "Tarif",
  "create.pricePlaceholder": "ex: Gratuit, 5\u20ac/enfant...",
  "create.maxSpots": "Places max",
  "create.unlimited": "Illimit\u00e9",
  "create.ageRange": "Tranche d\u2019\u00e2ge des enfants",
  "create.min": "Min",
  "create.max": "Max",
  "create.years": "ans",
  "create.start": "D\u00e9but *",
  "create.end": "Fin",
  "create.category": "Cat\u00e9gorie",
  "create.description": "Description *",
  "create.descriptionPlaceholder": "D\u00e9crivez la sortie, l\u2019ambiance, ce qu\u2019il faut pr\u00e9voir...",
  "create.externalLink": "Lien externe",
  "create.image": "Image (optionnel)",
  "create.imageHint": "L\u2019image sera redimensionn\u00e9e automatiquement.",
  "create.publishing": "Publication en cours...",
  "create.publishCopy": "Publier la copie \ud83d\ude80",
  "create.publishEvent": "Publier la sortie \ud83d\ude80",

  // Groups page
  "groups.title": "Mes groupes",
  "groups.subtitle": "Cr\u00e9ez un groupe pour votre \u00e9cole ou classe, puis partagez le code avec les autres parents.",
  "groups.createGroup": "Cr\u00e9er un groupe",
  "groups.join": "Rejoindre",
  "groups.newGroup": "Nouveau groupe",
  "groups.newGroupPlaceholder": "ex: \u00c9cole Jules Ferry - CE2",
  "groups.creating": "Cr\u00e9ation...",
  "groups.create": "Cr\u00e9er",
  "groups.joinWithCode": "Rejoindre avec un code",
  "groups.searching": "Recherche...",
  "groups.noGroups": "Aucun groupe pour le moment",
  "groups.noGroupsDesc": "Cr\u00e9ez un groupe ou rejoignez-en un avec un code !",
  "groups.leave": "Quitter",
  "groups.inviteCode": "Code d\u2019invitation :",
  "groups.copied": "Copi\u00e9 \u2713",
  "groups.copy": "Copier",
  "groups.viewGroupEvents": "Voir les sorties du groupe",
  "groups.loading": "Chargement...",

  // Settings page
  "settings.title": "R\u00e9glages",
  "settings.subtitle": "G\u00e9rez votre profil, vos groupes et vos notifications.",
  "settings.displayName": "Nom d\u2019affichage",
  "settings.namePlaceholder": "Votre pr\u00e9nom ou surnom",
  "settings.saved": "Enregistr\u00e9 !",
  "settings.save": "Enregistrer",
  "settings.myGroups": "Mes groupes",
  "settings.loading": "Chargement...",
  "settings.noGroups": "Vous n\u2019avez rejoint aucun groupe.",
  "settings.leave": "Quitter",
  "settings.notifications": "Notifications",
  "settings.notifUnsupported": "Les notifications ne sont pas support\u00e9es par votre navigateur.",
  "settings.status": "Statut :",
  "settings.notifEnabled": "Activ\u00e9es",
  "settings.notifBlocked": "Bloqu\u00e9es",
  "settings.notifOff": "Non activ\u00e9es",
  "settings.notifBlockedDesc": "Les notifications sont bloqu\u00e9es. Modifiez les permissions dans les r\u00e9glages de votre navigateur pour les r\u00e9activer.",
  "settings.enabling": "Activation...",
  "settings.notifEnabledMsg": "Notifications activ\u00e9es !",
  "settings.resync": "Re-synchroniser les notifications",
  "settings.enableNotif": "Activer les notifications",
  "settings.appearance": "Apparence",
  "settings.theme": "Th\u00e8me",
  "settings.light": "Clair",
  "settings.dark": "Sombre",
  "settings.auto": "Auto",
  "settings.language": "Langue",

  // Age formatting
  "age.range": "{0}\u2013{1} ans",
  "age.from": "d\u00e8s {0} ans",
  "age.upTo": "jusqu\u2019\u00e0 {0} ans",

  // EventMap
  "map.noGpsEvents": "Aucun \u00e9v\u00e9nement avec coordonn\u00e9es GPS.",
  "map.viewDetails": "Voir les d\u00e9tails \u2192",
  "map.participants": "{0} participant{1}",
};

// ---------------------------------------------------------------------------
// English translations
// ---------------------------------------------------------------------------
const en: Record<string, string> = {
  // Navigation
  "nav.groups": "Groups",
  "nav.events": "Events",
  "nav.settings": "Settings",
  "nav.create": "+ Create",

  // Hero
  "hero.badge": "For school parents \ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d\udc66",
  "hero.title": "Organize outings between school parents ",
  "hero.titleAccent": "in 1 minute.",
  "hero.subtitle": "No more 42 WhatsApp messages to find a date. Propose, gather, enjoy. \ud83c\udf89",
  "hero.ctaJoin": "Join school parents",
  "hero.ctaCreate": "Create an outing",

  // Why section
  "why.title": "Organizing an outing shouldn\u2019t be this hard \ud83e\udd2f",
  "why.subtitle": "Yet, between parents, it always is.",
  "why.pain1Title": "Too many messages",
  "why.pain1Desc": "WhatsApp groups overflowing just to plan a simple picnic at the park.",
  "why.pain2Title": "Impossible to find a date",
  "why.pain2Desc": "Between judo, dance, and weekends at grandma\u2019s, finding a slot is a puzzle.",
  "why.pain3Title": "We barely know other parents",
  "why.pain3Desc": "Hard to organize when you don\u2019t know the other families in the class.",
  "why.pain4Title": "Always the same ones organizing",
  "why.pain4Desc": "The mental load always falls on 2\u20133 motivated parents. It\u2019s not sustainable.",
  "why.cocoIs": "Coco is {0}, {1}, {2} and {3}. Just what you need to get together.",
  "why.simple": "simple",
  "why.local": "local",
  "why.private": "private",
  "why.frictionless": "frictionless",

  // How it works
  "how.title": "How it works \ud83e\udde9",
  "how.subtitle": "3 steps, zero hassle.",
  "how.step1Title": "Create or join a group",
  "how.step1Desc": "Create a group for your school or class and share the invite code with other parents.",
  "how.step2Title": "Propose an outing",
  "how.step2Desc": "Park, snack, museum, pool\u2026 Create an outing in seconds and group parents are notified.",
  "how.step3Title": "Organize together",
  "how.step3Desc": "Sign up, specify who brings what, get a reminder the day before. All you have to do is enjoy!",

  // Community
  "community.title": "A trusted community \ud83e\udd1d",
  "community.subtitle": "Coco creates a safe and warm space for your school\u2019s parents.",
  "community.bullet1Title": "Private by default",
  "community.bullet1Desc": "Only school parents can see and join outings.",
  "community.bullet2Title": "100% local",
  "community.bullet2Desc": "Your school, your neighborhood, your neighbors. Not another social network.",
  "community.bullet3Title": "No ads, no tracking",
  "community.bullet3Desc": "Your data stays yours. No ads, no reselling.",
  "community.bullet4Title": "Made for families",
  "community.bullet4Desc": "Designed by parents, for parents. Simple, caring, effective.",
  "community.conclusion": "Because the best childhood memories are created together, simply. \ud83c\udf08",

  // Social proof
  "social.title": "They can\u2019t wait \ud83d\ude80",
  "social.subtitle": "Coco is being built. Here\u2019s where we stand.",
  "social.stat1Value": "150+",
  "social.stat1Label": "interested families",
  "social.stat1Desc": "Parents like you, ready to simplify outings.",
  "social.stat2Value": "12",
  "social.stat2Label": "schools waiting",
  "social.stat2Desc": "From kindergarten to 5th grade, all over France.",
  "social.stat3Value": "100%",
  "social.stat3Label": "free at launch",
  "social.stat3Desc": "Early adopters will enjoy Coco for free.",

  // Final CTA
  "cta.title1": "Simplify the organization.",
  "cta.title2": "Enjoy the moment with your children.",
  "cta.subtitle": "Leave your email to be notified at launch. You\u2019ll also get a calendar invite so you don\u2019t miss anything. \ud83d\udcec",
  "cta.thankTitle": "Thank you! You\u2019re on the list.",
  "cta.thankDesc": "We\u2019ll notify you as soon as Coco is ready. See you soon!",
  "cta.errorEmail": "Please enter a valid email address.",
  "cta.errorDuplicate": "This email is already registered!",
  "cta.submit": "Sign me up \ud83d\ude80",
  "cta.nospam": "No spam, promise. Just a notification when it\u2019s ready. \ud83e\udd1e",

  // Footer
  "footer.text": "Coco \u2014 Copains du coin \u00a9 {0} \u2014 Made with love by parents, for parents.",

  // Notification banner
  "notif.enabled": "Notifications enabled!",
  "notif.question": "Receive notifications?",
  "notif.description": "Get notified about new outings and sign-ups.",
  "notif.enable": "Enable",
  "notif.later": "Later",

  // Categories
  "cat.parc": "\ud83c\udf33 Park / Outdoors",
  "cat.sport": "\u26bd Sport",
  "cat.musee": "\ud83c\udfa8 Museum / Exhibition",
  "cat.spectacle": "\ud83c\udfad Show",
  "cat.restaurant": "\ud83c\udf55 Restaurant / Snack",
  "cat.atelier": "\u2702\ufe0f Workshop / Crafts",
  "cat.piscine": "\ud83c\udfca Pool / Swimming",
  "cat.balade": "\ud83d\udeb6 Walk / Hike",
  "cat.autre": "\ud83d\udccc Other",
  "cat.all": "All",

  // Events page
  "events.home": "Home",
  "events.title": "Events",
  "events.new": "+ New",
  "events.search": "Search...",
  "events.list": "List",
  "events.map": "Map",
  "events.loading": "Loading...",
  "events.joinGroup": "Join a group to see events",
  "events.joinGroupDesc": "Create or join a parent group to get started.",
  "events.myGroups": "My groups \ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d\udc66",
  "events.noEvents": "No events yet",
  "events.noEventsDesc": "Be the first to propose an outing!",
  "events.proposeEvent": "Propose an outing \ud83c\udf89",
  "events.noUpcoming": "No upcoming events",
  "events.inCategory": " in this category",
  "events.pastEvents": "Past events",
  "events.loadingMap": "Loading map...",
  "events.past": "Past",
  "events.upcoming": "Upcoming",
  "events.free": "Free",
  "events.recurring": "Recurring",
  "events.organizedBy": "Organized by",
  "events.participant": "participant",
  "events.participants": "participants",
  "events.full": "full",
  "events.spotLeft": "{0} spot left",
  "events.spotsLeft": "{0} spots left",
  "events.coming": "Coming",
  "events.maybe": "Maybe",
  "events.cantMakeIt": "Can\u2019t make it",
  "events.cancelReg": "Cancel registration",
  "events.imComing": "I\u2019m coming \u270b",
  "events.maybeComing": "Maybe \ud83e\udd14",
  "events.eventFull": "This event is full",
  "events.firstName": "Your first name",
  "events.cancel": "Cancel",
  "events.addGCal": "Add to Google Calendar \ud83d\udcc5",
  "events.viewDetails": "View details",
  "events.viewLink": "View link",

  // Event detail
  "detail.allEvents": "All events",
  "detail.notFound": "Event not found",
  "detail.backToEvents": "Back to events",
  "detail.share": "Share \ud83d\udd17",
  "detail.linkCopied": "Link copied \u2713",
  "detail.gCal": "Google Calendar \ud83d\udcc5",
  "detail.downloadIcs": "Download .ics \ud83d\udce5",
  "detail.edit": "Edit \u270f\ufe0f",
  "detail.duplicate": "Duplicate \ud83d\udccb",
  "detail.delete": "Delete \ud83d\uddd1\ufe0f",
  "detail.confirm": "Confirm?",
  "detail.yesDelete": "Yes, delete",
  "detail.no": "No",
  "detail.confirmComing": "You confirm your attendance \u270b",
  "detail.confirmMaybe": "You indicate a maybe \ud83e\udd14",

  // Edit form
  "edit.title": "Title *",
  "edit.category": "Category",
  "edit.organizer": "Organizer *",
  "edit.start": "Start *",
  "edit.end": "End",
  "edit.location": "Location *",
  "edit.price": "Price",
  "edit.maxSpots": "Max spots",
  "edit.ageMin": "Age min",
  "edit.ageMax": "Age max",
  "edit.description": "Description *",
  "edit.externalLink": "External link",
  "edit.saving": "Saving...",
  "edit.save": "Save",
  "edit.cancel": "Cancel",
  "edit.searching": "Searching...",

  // Comments
  "comments.title": "Discussion",
  "comments.firstName": "Your first name",
  "comments.message": "Your message...",
  "comments.send": "Send",

  // Checklist
  "checklist.title": "Who brings what?",
  "checklist.illTakeCare": "I\u2019ll take care of it",
  "checklist.cancel": "Cancel",
  "checklist.placeholder": "e.g.: Cake, drinks, ball...",

  // Photos
  "photos.title": "Photos",
  "photos.uploading": "Uploading...",
  "photos.addPhoto": "Add a photo \ud83d\udcf8",
  "photos.noPhotos": "No photos yet. Share your memories!",

  // Weather
  "weather.clearSky": "Clear sky",
  "weather.partlyCloudy": "Partly cloudy",
  "weather.fog": "Fog",
  "weather.drizzle": "Drizzle",
  "weather.rain": "Rain",
  "weather.snow": "Snow",
  "weather.showers": "Showers",
  "weather.snowShowers": "Snow showers",
  "weather.thunderstorm": "Thunderstorm",
  "weather.unknown": "Unknown",

  // Create page
  "create.back": "Back",
  "create.duplicateTitle": "Duplicate an outing",
  "create.createTitle": "Propose an outing",
  "create.subtitle": "Fill in the info and share with parents!",
  "create.eventTitle": "Event title *",
  "create.eventTitlePlaceholder": "e.g.: Trip to the zoo",
  "create.firstName": "Your first name *",
  "create.firstNamePlaceholder": "e.g.: Sophie",
  "create.group": "Group",
  "create.noGroup": "No group",
  "create.recurrence": "Recurrence",
  "create.singleEvent": "Single event",
  "create.weekly": "Every week",
  "create.biweekly": "Every 2 weeks",
  "create.monthly": "Every month",
  "create.occurrences": "Number of occurrences (max 52)",
  "create.location": "Location *",
  "create.locationPlaceholder": "e.g.: Central Park, New York",
  "create.searching": "Searching...",
  "create.price": "Price",
  "create.pricePlaceholder": "e.g.: Free, $5/child...",
  "create.maxSpots": "Max spots",
  "create.unlimited": "Unlimited",
  "create.ageRange": "Children\u2019s age range",
  "create.min": "Min",
  "create.max": "Max",
  "create.years": "yrs",
  "create.start": "Start *",
  "create.end": "End",
  "create.category": "Category",
  "create.description": "Description *",
  "create.descriptionPlaceholder": "Describe the outing, the atmosphere, what to plan for...",
  "create.externalLink": "External link",
  "create.image": "Image (optional)",
  "create.imageHint": "The image will be automatically resized.",
  "create.publishing": "Publishing...",
  "create.publishCopy": "Publish copy \ud83d\ude80",
  "create.publishEvent": "Publish outing \ud83d\ude80",

  // Groups page
  "groups.title": "My groups",
  "groups.subtitle": "Create a group for your school or class, then share the code with other parents.",
  "groups.createGroup": "Create a group",
  "groups.join": "Join",
  "groups.newGroup": "New group",
  "groups.newGroupPlaceholder": "e.g.: Oak School - 3rd Grade",
  "groups.creating": "Creating...",
  "groups.create": "Create",
  "groups.joinWithCode": "Join with a code",
  "groups.searching": "Searching...",
  "groups.noGroups": "No groups yet",
  "groups.noGroupsDesc": "Create a group or join one with a code!",
  "groups.leave": "Leave",
  "groups.inviteCode": "Invite code:",
  "groups.copied": "Copied \u2713",
  "groups.copy": "Copy",
  "groups.viewGroupEvents": "View group events",
  "groups.loading": "Loading...",

  // Settings page
  "settings.title": "Settings",
  "settings.subtitle": "Manage your profile, groups, and notifications.",
  "settings.displayName": "Display name",
  "settings.namePlaceholder": "Your first name or nickname",
  "settings.saved": "Saved!",
  "settings.save": "Save",
  "settings.myGroups": "My groups",
  "settings.loading": "Loading...",
  "settings.noGroups": "You haven\u2019t joined any groups.",
  "settings.leave": "Leave",
  "settings.notifications": "Notifications",
  "settings.notifUnsupported": "Notifications are not supported by your browser.",
  "settings.status": "Status:",
  "settings.notifEnabled": "Enabled",
  "settings.notifBlocked": "Blocked",
  "settings.notifOff": "Not enabled",
  "settings.notifBlockedDesc": "Notifications are blocked. Change permissions in your browser settings to re-enable them.",
  "settings.enabling": "Enabling...",
  "settings.notifEnabledMsg": "Notifications enabled!",
  "settings.resync": "Re-sync notifications",
  "settings.enableNotif": "Enable notifications",
  "settings.appearance": "Appearance",
  "settings.theme": "Theme",
  "settings.light": "Light",
  "settings.dark": "Dark",
  "settings.auto": "Auto",
  "settings.language": "Language",

  // Age formatting
  "age.range": "{0}\u2013{1} years",
  "age.from": "from {0} years",
  "age.upTo": "up to {0} years",

  // EventMap
  "map.noGpsEvents": "No events with GPS coordinates.",
  "map.viewDetails": "View details \u2192",
  "map.participants": "{0} participant{1}",
};

const dictionaries: Record<Locale, Record<string, string>> = { fr, en };

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    const stored = localStorage.getItem("coco_locale") as Locale | null;
    if (stored === "fr" || stored === "en") {
      setLocaleState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("coco_locale", l);
    document.documentElement.lang = l;
  }

  function t(key: string, ...args: (string | number)[]): string {
    let text = dictionaries[locale][key] ?? key;
    args.forEach((arg, i) => {
      text = text.replace(`{${i}}`, String(arg));
    });
    return text;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useT() {
  const { t } = useContext(I18nContext);
  return t;
}
