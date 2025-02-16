"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { login } from "@/lib/auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(email, password)
      console.log("redirecting");
      await router.push("/order/create")
    } catch (err) {
      setError("Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login form */}
      <div className="flex-1 flex flex-col p-8 lg:p-16">
        <div className="flex-1">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-xl font-semibold">Synque</h1>
          </div>

          {/* Welcome text */}
          <div className="mb-8 max-w-sm">
            <h2 className="text-3xl font-medium mb-2">Welcome back.</h2>
            <p className="text-3xl text-gray-900">Log in to your account below.</p>
          </div>

          {/* Login form */}
          <div className="max-w-sm">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              variant="outline"
              className="w-full mb-4 h-12 text-gray-600 border"
              onClick={() => {
                /* Implement Google Sign In */
              }}
            >
              <Image src="https://www.google.com/favicon.ico" alt="Google" width={20} height={20} className="mr-2" />
              Sign in with Google
            </Button>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              <Button type="submit" className="w-full h-12 bg-black hover:bg-gray-800" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button className="text-gray-600 hover:text-gray-800 text-sm">Sign in with login link instead</button>
            </div>

            <div className="mt-6 text-center text-sm text-gray-600">
              Need to create a new organization?{" "}
              <a href="#" className="text-black hover:underline">
                Sign up
              </a>
            </div>

            <div className="mt-8 text-center text-sm text-gray-600">
              Need help logging in?{" "}
              <a href="#" className="text-black hover:underline">
                Reset your password
              </a>
            </div>
          </div>
        </div>

        {/* Trusted by section */}
        <div className="mt-auto pt-8">
          <p className="text-sm text-gray-500 mb-4">Trusted by teams at</p>
          <div className="grid grid-cols-3 gap-8 mb-8">
            <Image
              src="https://v0.blob.com/logos/ramp.svg"
              alt="Ramp"
              width={100}
              height={30}
              className="opacity-50 hover:opacity-100 transition-opacity"
            />
            <Image
              src="https://v0.blob.com/logos/doordash.svg"
              alt="DoorDash"
              width={100}
              height={30}
              className="opacity-50 hover:opacity-100 transition-opacity"
            />
            <Image
              src="https://v0.blob.com/logos/stripe.svg"
              alt="Stripe"
              width={100}
              height={30}
              className="opacity-50 hover:opacity-100 transition-opacity"
            />
          </div>
          <div className="grid grid-cols-3 gap-8">
            <Image
              src="https://v0.blob.com/logos/amazon.svg"
              alt="Amazon"
              width={100}
              height={30}
              className="opacity-50 hover:opacity-100 transition-opacity"
            />
            <Image
              src="https://v0.blob.com/logos/snowflake.svg"
              alt="Snowflake"
              width={100}
              height={30}
              className="opacity-50 hover:opacity-100 transition-opacity"
            />
            <Image
              src="https://v0.blob.com/logos/mercedes.svg"
              alt="Mercedes-Benz"
              width={100}
              height={30}
              className="opacity-50 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:block flex-1 bg-[#E8F3FF] relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4K5IVbTjWO8NRMNTBy5X549GKUgqsE.png"
            alt="Login illustration"
            fill
            style={{ objectFit: "cover" }}
          />
        </div>
      </div>
    </div>
  )
}

