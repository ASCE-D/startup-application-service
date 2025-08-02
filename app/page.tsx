"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

function LoginSignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (isLogin) {
      // Handle login
      console.log("Logging in with", { email, password });
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      if (res?.error) {
        setError(res.error);
      } else {
        router.push("/application"); // or wherever you want to go
      }
    } else {
      // Handle signup
      console.log("Signing up with", { name, email, password });
      fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          toast.success("Successfully registered");
          setLoading(false);
          router.push("/login");
        })
        .catch((err) => {
          toast.error(err.message);
          setLoading(false);
        });
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6")}>
          {/* Toggle Slider */}
          <div className="flex items-center justify-center">
            <div className="relative bg-gray-100 rounded-full p-1 w-64">
              <div
                className={cn(
                  "absolute top-1 h-8 w-28 bg-white rounded-full shadow-sm transition-all duration-300 ease-in-out",
                  isLogin ? "left-1" : "left-[133px]"
                )}
              />
              <div className="relative flex">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={cn(
                    "flex-1 py-2 px-4 text-sm font-medium rounded-full transition-colors duration-200 z-10",
                    isLogin
                      ? "text-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={cn(
                    "flex-1 py-2 px-4 text-sm font-medium rounded-full transition-colors duration-200 z-10",
                    !isLogin
                      ? "text-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {isLogin ? "Login to your account" : "Create your account"}
              </CardTitle>
              <CardDescription>
                {isLogin
                  ? "Enter your email below to login to your account"
                  : "Enter your details below to create your account"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <div className="flex flex-col gap-6">
                  {!isLogin && (
                    <div className="grid gap-3">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        required={!isLogin}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      {isLogin && (
                        <a
                          href="#"
                          className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                        >
                          Forgot your password?
                        </a>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  {!isLogin && (
                    <div className="grid gap-3">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        required={!isLogin}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  )}

                  {error && (
                    <div className="text-sm text-red-600 text-center">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <Button
                      type="submit"
                      className="w-full"
                      onClick={handleSubmit}
                    >
                      {isLogin ? "Login" : "Sign Up"}
                    </Button>
                    <Button variant="outline" className="w-full" type="button">
                      {isLogin ? "Login with Google" : "Sign up with Google"}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 text-center text-sm">
                  {isLogin ? (
                    <>
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className="underline underline-offset-4 hover:text-gray-600"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className="underline underline-offset-4 hover:text-gray-600"
                      >
                        Login
                      </button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default LoginSignupForm;
