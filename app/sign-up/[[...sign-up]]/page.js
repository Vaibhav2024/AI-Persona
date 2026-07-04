// app/sign-up/[[...sign-up]]/page.js
import { SignUp, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center select-none">
        <img src="/white_logo.png" alt="Persona AI Logo" className="h-20 w-auto mx-auto object-contain mb-4" />
        <p className="text-sm text-zinc-400 font-medium max-w-xs mx-auto leading-relaxed">
          Chat with your favourite tech educators
        </p>
      </div>

      <ClerkLoading>
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 shadow-xl rounded-2xl p-8 flex flex-col items-center justify-center space-y-6 min-h-[440px] animate-pulse">
          {/* Dynamic futuristic loader */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Outer glowing pulsing orbit */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-violet-500/20 animate-spin" style={{ animationDuration: '8s' }} />
            
            {/* Inner spinning gradient ring */}
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-violet-500 border-l-fuchsia-500 animate-spin" />
            
            {/* Counter-spinning secondary ring */}
            <div className="absolute inset-4 rounded-full border-4 border-transparent border-b-cyan-400 border-r-violet-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
            
            {/* Center core pulse */}
            <div className="absolute inset-6 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-full shadow-lg shadow-violet-500/50 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </div>
          </div>
          
          <div className="space-y-2 text-center w-full">
            <h3 className="text-zinc-200 font-semibold tracking-wide text-sm">Initializing Secure Session</h3>
            <p className="text-xs text-zinc-500">Connecting to server...</p>
          </div>

          {/* Shimmer skeleton elements mimicking Clerk's inputs */}
          <div className="w-full space-y-3 pt-4">
            <div className="h-9 bg-zinc-800/80 rounded-lg w-full" />
            <div className="h-9 bg-zinc-800/80 rounded-lg w-full" />
            <div className="h-10 bg-zinc-200/90 rounded-lg w-full mt-2" />
          </div>
        </div>
      </ClerkLoading>

      <ClerkLoaded>
        <SignUp
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
      </ClerkLoaded>
    </main>
  );
}
