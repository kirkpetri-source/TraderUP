import * as admin from "firebase-admin";
import "firebase-admin/firestore";

let app: admin.app.App | null = null;

function parseServiceAccount(): admin.ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Erro ao interpretar FIREBASE_SERVICE_ACCOUNT", error);
    throw new Error("FIREBASE_SERVICE_ACCOUNT inválido. Verifique o JSON nas variáveis de ambiente.");
  }
}

export function getAdminApp(): admin.app.App {
  if (app) {
    return app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID não configurado");
  }

  const serviceAccount = parseServiceAccount();
  if (!serviceAccount && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT não configurado");
  }

  app = admin.initializeApp({
    credential: serviceAccount
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault(),
    projectId,
  });

  return app;
}

export function getFirestore() {
  return getAdminApp().firestore();
}

export function getAuth() {
  return getAdminApp().auth();
}

export { admin };
