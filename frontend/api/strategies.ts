import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getFirestore, getAuth, admin } from "./lib/firebaseAdmin.js";
import type { StrategyPayload } from "./lib/types.js";

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
  const firestore = getFirestore();

  if (req.method === "GET") {
    try {
      const userId = await resolveUserId(req);
      let query = firestore.collection("strategies").orderBy("createdAt", "desc");
      if (userId) {
        query = query.where("userId", "==", userId);
      }
      const snapshot = await query.get();
      const strategies = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return res.json(strategies);
    } catch (error) {
      console.error("Erro em GET /api/strategies", error);
      return res.status(500).json({ error: "Falha ao listar estratégias" });
    }
  }

  if (req.method === "POST") {
    try {
      const rawBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const payload = rawBody as StrategyPayload;
      if (!payload?.name || !payload?.conditions || !payload.symbols?.length) {
        return res.status(400).json({ error: "Payload inválido" });
      }
      const now = admin.firestore.FieldValue.serverTimestamp();
      const userId = (await resolveUserId(req)) ?? "anonymous";
      const ref = await firestore.collection("strategies").add({
        ...payload,
        isActive: payload.isActive ?? true,
        userId,
        createdAt: now,
        updatedAt: now,
      });
      const snapshot = await ref.get();
      return res.status(201).json({ id: ref.id, ...snapshot.data() });
    } catch (error) {
      console.error("Erro em POST /api/strategies", error);
      return res.status(500).json({ error: "Falha ao criar estratégia" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Método não permitido" });
}
