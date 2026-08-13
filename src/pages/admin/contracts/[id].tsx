import { useParams } from 'react-router-dom'
import ContractDetailPage from '../../../pages/contracts/[id]'

export default function AdminContractDetailPage() {
  const { adminId } = useParams<{ adminId: string }>()
  return <ContractDetailPage basePath={`/admin/${adminId}`} showResponsible />
}
