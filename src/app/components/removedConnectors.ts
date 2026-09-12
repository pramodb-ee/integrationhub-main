// Retired identifiers are kept only to reject old URLs and saved browser records.
export function isRemovedConnector(type: string | null | undefined): boolean {
  return ['facebook-ads-conversion', 'google-ads-conversion', 'id-based'].includes(type ?? '');
}
