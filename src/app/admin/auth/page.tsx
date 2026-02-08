"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const LOCAL_STORAGE_KEY = "admin-token";

export default function LoginWindow() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: any) => {
    setPassword(e.target.value);
    setError("");
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem(LOCAL_STORAGE_KEY, data.token);
        setIsLoading(false);
        router.push("/admin/panel");
      } else {
        setError(data.message || "Falsches Passwort. Bitte versuchen Sie es erneut.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Login-Fehler:", error);
      setError("Verbindungsfehler. Bitte versuchen Sie es später erneut.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen  flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Admin login</h2>
          </div>
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">{error}</div>
            )}

            {/* Password field */}
            <div className="relative">
              <input
                type="password"
                name="password"
                value={password}
                onChange={handleInputChange}
                placeholder="Zugangswort eingeben"
                className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 hover:bg-white/10"
                required
                onKeyDown={(e) => {if (e.key === "Enter") {handleSubmit()}}}
              />
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !password.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Vamós...
                </div>
              ) : (
                "Vamós!"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
