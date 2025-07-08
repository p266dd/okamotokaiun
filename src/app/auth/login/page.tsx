import { z } from "zod/v4";
import Image from "next/image";
import { decrypt } from "@/lib/jwt";
import { JWTPayload } from "jose";
import LoginForm from "@/components/auth/login-form";

import CompanyLogo from "@/assets/company_logo.png";

// Shadcn
import { Card, CardContent } from "@/components/ui/card";

// Type
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function LoginPage(props: { searchParams: SearchParams }) {
  const getSearchParams = await props.searchParams;

  const paramsObject = {
    action: getSearchParams?.action,
    token: getSearchParams?.token,
  };

  // Sanitize action and token.
  const paramsSchema = z.object({
    action: z.enum(["recover", "reset", "embark"]).optional(),
    token: z.string().optional(),
  });

  const validateParams = paramsSchema.safeParse(paramsObject);

  let decryptToken: JWTPayload | null = null;

  if (validateParams.success && validateParams?.data?.token) {
    decryptToken = await decrypt(validateParams.data.token);
  }

  return (
    <div className="bg-[#f6f5f6] flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0 shadow-2xl">
            <CardContent className="grid p-0 md:grid-cols-2">
              <LoginForm />

              <div className="bg-primary relative hidden  items-center justify-center md:flex">
                <Image
                  priority
                  src={CompanyLogo}
                  alt="Okamoto Kaiun Logo"
                  className="max-w-48"
                />
              </div>
            </CardContent>
          </Card>
          <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4"></div>
        </div>
      </div>
    </div>
  );
}
