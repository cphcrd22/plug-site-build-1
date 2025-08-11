export function flagEmoji(iso2: string): string {
    return iso2
      .toUpperCase()
      .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
  }
  