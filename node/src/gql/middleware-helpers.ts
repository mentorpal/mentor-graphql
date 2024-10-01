import { firebaseApp } from "../app";
import { DecodedIdToken, getAuth } from "firebase-admin/auth";

export async function getFirebaseUserFromReqAccessToken(
  authHeader: string
): Promise<DecodedIdToken | undefined> {
  if (!authHeader) {
    return undefined;
  }
  const auth = getAuth(firebaseApp);
  const token = authHeader.split(" ")[1];
  if (!token) {
    return undefined;
  }
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (e) {
    console.error(e);
    return undefined;
  }
}