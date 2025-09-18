import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-2 sm:px-6 lg:px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please sign in to your account
          </p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-indigo-600 hover:bg-indigo-700 text-sm normal-case",
              card: "bg-card border shadow-md",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: 
                "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
              formFieldLabel: "text-foreground",
              formFieldInput: 
                "bg-background border-gray-300 dark:border-gray-600 text-foreground",
              footerActionLink: "text-indigo-600 hover:text-indigo-500"
            }
          }}
        />
      </div>
    </div>
  )
}
