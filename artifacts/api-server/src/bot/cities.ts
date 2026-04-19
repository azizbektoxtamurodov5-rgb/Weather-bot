export interface City {
  name: string;
  label: string;
  query: string;
}

export const UZBEKISTAN_CITIES: City[] = [
  { name: "toshkent", label: "🏙️ Toshkent", query: "Tashkent,UZ" },
  { name: "samarqand", label: "🕌 Samarqand", query: "Samarkand,UZ" },
  { name: "buxoro", label: "🕌 Buxoro", query: "Bukhara,UZ" },
  { name: "namangan", label: "🌿 Namangan", query: "Namangan,UZ" },
  { name: "andijon", label: "🏭 Andijon", query: "Andijan,UZ" },
  { name: "fargona", label: "🌾 Farg'ona", query: "Fergana,UZ" },
  { name: "qarshi", label: "🏜️ Qarshi", query: "Karshi,UZ" },
  { name: "nukus", label: "🌊 Nukus", query: "Nukus,UZ" },
  { name: "urganch", label: "🏛️ Urganch", query: "Urgench,UZ" },
  { name: "termiz", label: "☀️ Termiz", query: "Termez,UZ" },
  { name: "guliston", label: "🌺 Guliston", query: "Guliston,UZ" },
  { name: "jizzax", label: "🌄 Jizzax", query: "Jizzax,UZ" },
  { name: "zomin", label: "⛰️ Zomin (Jizzax)", query: "Zomin,UZ" },
  { name: "navoi", label: "⛏️ Navoiy", query: "Navoi,UZ" },
];

export const DEFAULT_CITY: City = {
  name: "jizzax",
  label: "🌄 Jizzax viloyati",
  query: "Jizzax,UZ",
};

export function findCity(text: string): City | undefined {
  const lower = text.toLowerCase().trim();
  return UZBEKISTAN_CITIES.find(
    (c) => c.name === lower || c.label.toLowerCase().includes(lower)
  );
}

export const CITY_KEYBOARD = {
  inline_keyboard: [
    [
      { text: "🏙️ Toshkent", callback_data: "city:toshkent" },
      { text: "🕌 Samarqand", callback_data: "city:samarqand" },
    ],
    [
      { text: "🕌 Buxoro", callback_data: "city:buxoro" },
      { text: "🌿 Namangan", callback_data: "city:namangan" },
    ],
    [
      { text: "🏭 Andijon", callback_data: "city:andijon" },
      { text: "🌾 Farg'ona", callback_data: "city:fargona" },
    ],
    [
      { text: "🏜️ Qarshi", callback_data: "city:qarshi" },
      { text: "🌊 Nukus", callback_data: "city:nukus" },
    ],
    [
      { text: "🏛️ Urganch", callback_data: "city:urganch" },
      { text: "☀️ Termiz", callback_data: "city:termiz" },
    ],
    [
      { text: "🌺 Guliston", callback_data: "city:guliston" },
      { text: "⛏️ Navoiy", callback_data: "city:navoi" },
    ],
    [
      { text: "🌄 Jizzax", callback_data: "city:jizzax" },
      { text: "⛰️ Zomin", callback_data: "city:zomin" },
    ],
  ],
};
