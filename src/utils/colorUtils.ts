
export const isColor = (strColor: string) => {
  const s = new Option().style;
  s.color = strColor;
  return Boolean(s.color);
};
