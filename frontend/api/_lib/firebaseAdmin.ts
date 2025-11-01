import * as admin from "firebase-admin";

let app: admin.app.App | null = null;

export function getAdminApp(): admin.app.App {
  if (app) {
    return app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID não configurado");
  }

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
