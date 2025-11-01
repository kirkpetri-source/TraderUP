import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getFirestore, getAuth, admin } from "../lib/firebaseAdmin.js";
import type { StrategyPayload } from "../lib/types.js";

async function resolveUserId(req: VercelRequest): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring("Bearer ".length);
  try {
    const decoded = await getAuth().verifyIdToken(token);
    return decoded.uid;
  } catch (error) {
    console.warn("Token inválido", error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const firestore = getFirestore();
  const docRef = firestore.collection("strategies").doc(id);

  if (req.method === "PATCH") {
    try {
      const rawBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const payload = rawBody as Partial<StrategyPayload> & { isActive?: boolean };
      await docRef.set(
        {
          ...payload,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      const updated = await docRef.get();
      return res.json({ id, ...updated.data() });
    } catch (error) {
      console.error(`Erro em PATCH /api/strategies/${id}`, error);
      return res.status(500).json({ error: "Falha ao atualizar estratégia" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const userId = await resolveUserId(req);
      if (!userId) {
        // Ainda permite deletar, mas recomenda autenticação
        console.warn("Delete sem autenticação - recomendar proteger futuramente");
      }
      await docRef.delete();
      return res.status(204).end();
    } catch (error) {
      console.error(`Erro em DELETE /api/strategies/${id}`, error);
      return res.status(500).json({ error: "Falha ao remover estratégia" });
    }
  }

  res.setHeader("Allow", "PATCH, DELETE");
  return res.status(405).json({ error: "Método não permitido" });
}
