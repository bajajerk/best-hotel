"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BookRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/book/rooms");
  }, [router]);
  return null;
}
