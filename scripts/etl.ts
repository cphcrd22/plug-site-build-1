import fs from 'node:fs/promises'
import path from 'node:path'

type PlugRow = {
  countryCode: string
  plugTypes: string[]    // parsed later
  voltageMin: number
  voltageMax: number
  frequencyHz: number
  notes?: string
  lastVerified?: string
  sources?: string[]
}

async function run() {
  // 1) Load sources (replace with your CSV/JSON loader)
  const iso = await readCSV('sources/iso-3166.csv')              // [{alpha2,name}]
  const plugs = await readCSV('sources/plug-source.csv') as any[] // map to PlugRow

  const isoSet = new Set(iso.map((r:any) => r.alpha2.toUpperCase()))
  const outPlugs: Record<string, any> = {}
  // Build plug specs map
  for (const r of plugs) {
    const cc = String(r.countryCode || '').toUpperCase()
    if (!isoSet.has(cc)) throw new Error(`Unknown ISO country: ${cc}`)
    const types = String(r.plugTypes || '').split('|').map((x:string) => x.trim()).filter(Boolean)
    if (!types.every((t:string) => /^[A-OT]$/.test(t))) throw new Error(`Bad plugTypes for ${cc}`)
    const vmin = Number(r.voltageMin), vmax = Number(r.voltageMax)
    if (!Number.isFinite(vmin) || !Number.isFinite(vmax)) throw new Error(`Bad voltage for ${cc}`)
    const hz = Number(r.frequencyHz); if (![50,60].includes(hz)) throw new Error(`Bad frequencyHz for ${cc}`)
    outPlugs[cc] = {
      plugTypes: types,
      voltage: [vmin, vmax],
      frequencyHz: hz,
      notes: r.notes || undefined,
      lastVerified: r.lastVerified || undefined,
      sources: String(r.sources || '').split('|').filter(Boolean)
    }
  }

  // Write merged dataset
  const merged = iso.map((r:any) => {
    const cc = r.alpha2.toUpperCase()
    const spec = outPlugs[cc] || { plugTypes: [], voltage: [], frequencyHz: 0 }
    return {
      code: cc,
      country: r.name,
      plug_type: spec.plugTypes,
      voltage: spec.voltage.map((v:number) => String(v)),
      frequency: [String(spec.frequencyHz)],
    }
  })
  await fs.writeFile(path.join('data','merged.json'), JSON.stringify(merged, null, 2))

  // Echo suggested version (paste into .env.local)
  const version = `DATASET_${new Date().toISOString().slice(0,10).replace(/-/g,'_')}`
  console.log('Suggested DATASET_VERSION=', version)
}

// --- trivial CSV reader (replace with a robust parser if you like) ---
async function readCSV(file: string) {
  const text = await fs.readFile(path.join(process.cwd(), file), 'utf8')
  const [header, ...rows] = text.trim().split(/\r?\n/)
  const cols = header.split(',').map(s => s.trim())
  return rows.map(line => {
    const vals = line.split(',').map(s => s.trim())
    return Object.fromEntries(cols.map((c,i) => [c, vals[i] ?? '']))
  })
}

run().catch(e => { console.error(e); process.exit(1) })
