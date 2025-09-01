export const getEnvVariable = (key: string): string => {
  if (
    window.ENV &&
    window.ENV[key] !== undefined &&
    !window.ENV[key].startsWith('$')
  ) {
    console.log('Getting env variable from window', key, window.ENV[key]);
    return window.ENV[key];
  }

  const variable = import.meta.env[key] || '';
  console.log('Getting env variable from meta', key, variable);
  return variable;
};
