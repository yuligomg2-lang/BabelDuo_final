export const getMessageDateInfo = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const key = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  let label = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  if (isSameDay(date, today)) label = "Hoy";
  else if (isSameDay(date, yesterday)) label = "Ayer";

  return { key, label };
};
