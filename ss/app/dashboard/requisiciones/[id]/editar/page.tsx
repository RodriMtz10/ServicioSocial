'use client';
import { useParams } from 'next/navigation';
import FormularioRequisicion from '@/components/requisiciones/FormularioRequisicion';

export default function EditarRequisicionPage() {
  const { id } = useParams<{ id: string }>();
  return <FormularioRequisicion id={id} />;
}
