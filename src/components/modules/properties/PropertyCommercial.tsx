import Card from '../../ui/Card'
import { InfoField } from '../../ui/InfoField'
import { DollarSign, TrendingUp, FileText, Percent, Target } from 'react-feather'

export default function PropertyCommercial({ property }: { property: any }) {
  const p = property
  if (!p.commercialData) return <p className="text-center text-text-secondary py-8">Aucune information commerciale renseignée</p>

  const c = p.commercialData
  const fields: React.ReactNode[] = []

  if (c.activity) fields.push(<InfoField key="activity" label="Activité" value={c.activity} icon={<Target size={14} />} />)
  if (c.revenue) fields.push(<InfoField key="revenue" label="Chiffre d'affaires" value={`${c.revenue.toLocaleString()} MAD`} icon={<DollarSign size={14} />} />)
  if (c.result) fields.push(<InfoField key="result" label="Résultat" value={c.result} icon={<TrendingUp size={14} />} />)
  if (c.employees) fields.push(<InfoField key="employees" label="Employés" value={c.employees} icon={<FileText size={14} />} />)
  if (c.surfaceType) fields.push(<InfoField key="surfaceType" label="Type de surface" value={c.surfaceType} icon={<FileText size={14} />} />)
  if (c.clientType) fields.push(<InfoField key="clientType" label="Type de clientèle" value={c.clientType} icon={<Percent size={14} />} />)
  if (c.franchise) fields.push(<InfoField key="franchise" label="Franchise" value={c.franchise} icon={<FileText size={14} />} />)
  if (c.turnover) fields.push(<InfoField key="turnover" label="Chiffre d'affaires" value={`${c.turnover.toLocaleString()} MAD`} icon={<DollarSign size={14} />} />)
  if (c.margin) fields.push(<InfoField key="margin" label="Marge" value={`${c.margin}%`} icon={<TrendingUp size={14} />} />)
  if (c.rent) fields.push(<InfoField key="rent" label="Loyer" value={`${c.rent.toLocaleString()} MAD`} icon={<DollarSign size={14} />} />)
  if (c.rentDC) fields.push(<InfoField key="rentDC" label="Loyer Droit au bail" value={`${c.rentDC.toLocaleString()} MAD`} icon={<DollarSign size={14} />} />)
  if (c.remarks) fields.push(<InfoField key="remarks" label="Remarques" value={c.remarks} icon={<FileText size={14} />} />)

  if (fields.length === 0) return <p className="text-center text-text-secondary py-8">Aucune information commerciale renseignée</p>

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h3 className="font-semibold mb-4">Données commerciales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{fields}</div>
      </Card>
    </div>
  )
}