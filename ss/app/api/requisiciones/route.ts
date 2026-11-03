import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = session.user as any;
  
  return NextResponse.json({
    success: true,
    userRole: user.role,
    message: "Registros obtenidos correctamente."
  });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  // Regla de Seguridad: Impedir que un docente elimine registros
  if (user?.role === "docente") {
    return NextResponse.json(
      { error: "Permiso denegado: Los docentes no pueden eliminar requisiciones." },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true });
}