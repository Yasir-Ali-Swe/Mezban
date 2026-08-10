"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const Page = () => {
  const router = useRouter();

  useEffect(() => {
    const businessType = localStorage.getItem("businessType");
    console.log("Business Type from localStorage:", businessType);

    if (businessType === "ECOMMERCE") {
      router.replace("/ecommerce");
    } else if (businessType === "RESTAURANT") {
      router.replace("/restaurant");
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-sm text-muted-foreground">
        Taking you to the dashboard...
      </p>
    </div>
  );
};

export default Page;
