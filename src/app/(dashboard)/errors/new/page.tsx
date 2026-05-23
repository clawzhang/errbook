import { ErrorForm } from "@/components/errors/error-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NewErrorPage() {
  const session = await auth();
  let defaultValues = undefined;

  if (session?.user?.id) {
    const lastError = await prisma.error.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        subject: true,
        source: true,
        sourceDetail: true,
      },
    });

    if (lastError) {
      defaultValues = {
        subject: lastError.subject,
        source: lastError.source,
        sourceDetail: lastError.sourceDetail,
      };
    }
  }

  return <ErrorForm mode="create" defaultValues={defaultValues} />;
}
