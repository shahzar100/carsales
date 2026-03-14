const randomHex = (length: number): string => {
  let result = "";
  const chars = "0123456789abcdef";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

export const v4 = (): string => {
  return `${randomHex(8)}-${randomHex(4)}-4${randomHex(3)}-${randomHex(4)}-${randomHex(12)}`;
};

export default { v4 };
