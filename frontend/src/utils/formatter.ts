export function shortenAddress(address: string|null|undefined) {
  if (!address) return "";
  return `${address.substring(0, 7)}...${address.substring(address.length - 5)}`;
}