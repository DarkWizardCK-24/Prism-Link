import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { buildEvent } from "./analytics";
import { auth, db } from "./firebase";
import { LINK_DEFAULTS, PROFILE_DEFAULTS, type AnalyticsEvent, type LinkItem, type Profile } from "./types";
import { RESERVED_USERNAMES, USERNAME_RE } from "./utils";

const linksCol = (uid: string) => collection(db, "users", uid, "links");
const eventsCol = (uid: string) => collection(db, "users", uid, "events");

const toProfile = (data: Record<string, unknown>) => ({ ...PROFILE_DEFAULTS, ...data }) as unknown as Profile;
const toLink = (id: string, data: Record<string, unknown>) => ({ ...LINK_DEFAULTS, ...data, id }) as unknown as LinkItem;

export function validateUsername(username: string): string | null {
  if (!USERNAME_RE.test(username)) return "Use 3–24 letters, numbers, dots or underscores.";
  if (RESERVED_USERNAMES.has(username)) return "That username is reserved.";
  return null;
}

export async function isUsernameAvailable(username: string) {
  const snap = await getDoc(doc(db, "usernames", username));
  return !snap.exists();
}

/* ---------- Account / profile ---------- */

export async function createAccount(input: {
  email: string;
  password: string;
  username: string;
  displayName: string;
}) {
  const username = input.username.toLowerCase();
  const problem = validateUsername(username);
  if (problem) throw new Error(problem);
  if (!(await isUsernameAvailable(username))) throw new Error("username-taken");

  const cred = await createUserWithEmailAndPassword(auth, input.email, input.password);
  const uid = cred.user.uid;
  const profile: Profile = {
    ...PROFILE_DEFAULTS,
    uid,
    username,
    displayName: input.displayName.trim() || username,
    bio: "",
    avatarUrl: "",
    theme: "aurora",
    buttonStyle: "glass",
    buttonShape: "pill",
    views: 0,
    createdAt: Date.now(),
  };

  try {
    await runTransaction(db, async (tx) => {
      const nameRef = doc(db, "usernames", username);
      if ((await tx.get(nameRef)).exists()) throw new Error("username-taken");
      tx.set(nameRef, { uid });
      tx.set(doc(db, "users", uid), profile);
    });
  } catch (err) {
    await deleteUser(cred.user).catch(() => undefined);
    throw err;
  }
}

export function subscribeProfile(uid: string, cb: (p: Profile | null) => void): Unsubscribe {
  return onSnapshot(doc(db, "users", uid), (snap) => cb(snap.exists() ? toProfile(snap.data()) : null));
}

export type ProfileEdit = Partial<
  Pick<
    Profile,
    | "displayName"
    | "bio"
    | "avatarUrl"
    | "theme"
    | "buttonStyle"
    | "buttonShape"
    | "socials"
    | "bgType"
    | "bgColor"
    | "bgColor2"
    | "bgImage"
    | "bgOverlay"
    | "cardFrom"
    | "cardTo"
  >
>;

export async function updateProfile(uid: string, data: ProfileEdit) {
  await updateDoc(doc(db, "users", uid), data);
}

export async function changeUsername(uid: string, oldName: string, newName: string) {
  const next = newName.toLowerCase();
  const problem = validateUsername(next);
  if (problem) throw new Error(problem);
  await runTransaction(db, async (tx) => {
    const nextRef = doc(db, "usernames", next);
    if ((await tx.get(nextRef)).exists()) throw new Error("username-taken");
    tx.set(nextRef, { uid });
    tx.delete(doc(db, "usernames", oldName));
    tx.update(doc(db, "users", uid), { username: next });
  });
}

/* ---------- Links CRUD (links, headers, dividers, embeds) ---------- */

export function subscribeLinks(uid: string, cb: (l: LinkItem[]) => void): Unsubscribe {
  return onSnapshot(query(linksCol(uid), orderBy("order")), (snap) =>
    cb(snap.docs.map((d) => toLink(d.id, d.data()))),
  );
}

export type NewItem = Partial<
  Pick<LinkItem, "kind" | "title" | "url" | "iconType" | "emoji" | "thumbnail" | "startAt" | "endAt" | "collapsible" | "groupId" | "gradFrom" | "gradTo">
>;

export async function addLink(uid: string, data: NewItem, topOrder: number) {
  const item: Omit<LinkItem, "id"> = {
    ...LINK_DEFAULTS,
    title: "",
    url: "",
    ...data,
    active: true,
    order: topOrder - 1,
    clicks: 0,
    createdAt: Date.now(),
  };
  await addDoc(linksCol(uid), item);
}

export type LinkEdit = Partial<
  Pick<LinkItem, "title" | "url" | "active" | "iconType" | "emoji" | "thumbnail" | "startAt" | "endAt" | "collapsible" | "gradFrom" | "gradTo">
>;

export async function updateLink(uid: string, id: string, data: LinkEdit) {
  await updateDoc(doc(db, "users", uid, "links", id), data);
}

export async function deleteLink(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "links", id));
}

/** Persists a drag-and-drop result: new order and parent group for every item that moved. */
export async function moveItems(uid: string, updates: Array<{ id: string; order: number; groupId: string | null }>) {
  const batch = writeBatch(db);
  updates.forEach((u) => batch.update(doc(db, "users", uid, "links", u.id), { order: u.order, groupId: u.groupId }));
  await batch.commit();
}

/** Deletes a group but keeps its links, which return to the top level where the group used to be. */
export async function deleteGroup(uid: string, group: LinkItem, children: LinkItem[]) {
  const batch = writeBatch(db);
  children.forEach((c, i) => batch.update(doc(db, "users", uid, "links", c.id), { groupId: null, order: group.order + (i + 1) / 1000 }));
  batch.delete(doc(db, "users", uid, "links", group.id));
  await batch.commit();
}

/* ---------- Public page ---------- */

export async function getPublicPage(username: string): Promise<{ profile: Profile; links: LinkItem[] } | null> {
  const nameSnap = await getDoc(doc(db, "usernames", username.toLowerCase()));
  if (!nameSnap.exists()) return null;
  const uid = nameSnap.data().uid as string;
  const userSnap = await getDoc(doc(db, "users", uid));
  if (!userSnap.exists()) return null;
  const linkSnap = await getDocs(query(linksCol(uid), orderBy("order")));
  return {
    profile: toProfile(userSnap.data()),
    links: linkSnap.docs.map((d) => toLink(d.id, d.data())),
  };
}

/* ---------- Tracking & analytics ---------- */

async function logEvent(uid: string, type: "view" | "click", linkId?: string) {
  try {
    await addDoc(eventsCol(uid), await buildEvent(type, linkId));
  } catch {
    /* analytics must never break the page */
  }
}

export async function trackView(uid: string) {
  await Promise.all([updateDoc(doc(db, "users", uid), { views: increment(1) }).catch(() => undefined), logEvent(uid, "view")]);
}

export async function trackClick(uid: string, linkId: string) {
  await Promise.all([
    updateDoc(doc(db, "users", uid, "links", linkId), { clicks: increment(1) }).catch(() => undefined),
    logEvent(uid, "click", linkId),
  ]);
}

export function subscribeEvents(uid: string, sinceMs: number, cb: (e: AnalyticsEvent[]) => void): Unsubscribe {
  return onSnapshot(query(eventsCol(uid), where("ts", ">=", sinceMs), orderBy("ts"), limit(5000)), (snap) =>
    cb(snap.docs.map((d) => d.data() as AnalyticsEvent)),
  );
}
