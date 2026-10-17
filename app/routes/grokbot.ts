import deck from "../content/grokbot.html?raw";

export function loader() {
  return new Response(deck, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
