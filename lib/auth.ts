import axios from "axios"
import { jwtDecode } from "jwt-decode"

export interface LoginResponse {
  access_token: string
  expires: number
  refresh_token: string
}

export interface UserProfile {
  email: string
  name: string
  role: string
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const response = await axios.post("https://orq-dev.synque.ca/auth/login", {
      email,
      password,
    })
    if (response.data && response.data.data && response.data.data.access_token) {
      // Store the tokens in localStorage
      localStorage.setItem("access_token", response.data.data.access_token)
      localStorage.setItem("refresh_token", response.data.data.refresh_token)
      console.log("..Login successful - tokens stored in localStorage")
    } else {
      console.error("..Login response did not contain access_token", response.data)
      throw new Error("Invalid login response")
    }

    return response.data.data
  } catch (error) {
    console.error("Login error:", error)
    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", error.response?.data)
    }
    throw error
  }
}

export function getUser(): UserProfile | null {
  const token = localStorage.getItem("access_token")
  if (!token) return null

  try {
    const decoded = jwtDecode(token) as UserProfile
    return decoded
  } catch (error) {
    console.error("Error decoding token:", error)
    return null
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode(token) as { exp: number }
    if (decoded.exp < Date.now() / 1000) {
      console.warn("Token has expired")
      return true
    }
    return false
  } catch (error) {
    console.error("Error decoding token:", error)
    return true
  }
}

export function isAuthenticated(): boolean {
  const token = localStorage.getItem("access_token")
  return !!token && !isTokenExpired(token)
}

export function logout() {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
}

// Add this function to get the access token for API requests
export function getAccessToken(): string | null {
  return localStorage.getItem("access_token")
}

export function setAccessToken(token: string): void {
  localStorage.setItem("access_token", token)
}

