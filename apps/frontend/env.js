window.ENV = {
  VITE_API_URL: "$VITE_API_URL".startsWith("$")
    ? import.meta.env.VITE_API_URL
    : "$VITE_API_URL",
};
