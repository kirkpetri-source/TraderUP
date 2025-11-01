import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getFirestore } from "./lib/firebaseAdmin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const snapshot = await getFirestore()
      .collection("alerts")
      .orderBy("triggeredAt", "desc")
      .limit(50)
      .get();

    const alerts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    }));
    return res.json(alerts);
  } catch (error) {
    console.error("Erro em /api/alerts", error);
    return res.status(500).json({ error: "Falha ao carregar alertas" });
  }
}
