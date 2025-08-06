"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export async function revalidateWithTag(tag) {
  revalidateTag(tag);
}
export default async function revalidate(path) {
  revalidatePath(path);
}
