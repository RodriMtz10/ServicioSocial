'use client';
import { useParams } from 'next/navigation';
import DetalleRequisicion from '@/components/requisiciones/DetalleRequisicion';

export default function RequisicionDetallePage() {
  const { id } = useParams<{ id: string }>();
  return <DetalleRequisicion id={id} />;
}
