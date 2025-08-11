export type PlugSpec = {
    plugTypes: string[]
    voltage: number[]
    frequencyHz: number
    notes?: string
    lastVerified?: string
    sources?: string[]
  }
  
  export type LookupOk = {
    query: string
    resolved: { type: 'country'; countryCode: string; name?: string; flag?: string }
    spec: PlugSpec
    confidence: number
    version: string
  }
  
  export type LookupNoMatch =
    | { query: string; status: 'no_match' }
    | { query: string; status: 'no_data_for_country'; countryCode: string }
  