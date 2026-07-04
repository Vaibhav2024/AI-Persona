// app/sign-in/[[...sign-in]]/page.js
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">Persona AI</h1>
        <p className="text-sm text-zinc-400 mt-1">Chat with your favourite tech educators</p>
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full max-w-sm",
            card: "bg-zinc-900 border border-zinc-800 shadow-xl rounded-2xl",
            headerTitle: "text-zinc-50",
            headerSubtitle: "text-zinc-400",
            socialButtonsBlockButton: "bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700",
            dividerLine: "bg-zinc-700",
            dividerText: "text-zinc-500",
            formFieldLabel: "text-zinc-300",
            formFieldInput: "bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-zinc-500",
            footerActionLink: "text-zinc-300 hover:text-zinc-50",
            formButtonPrimary: "bg-zinc-200 text-zinc-900 hover:bg-zinc-300",
          },
        }}
      />
    </main>
  );
}
