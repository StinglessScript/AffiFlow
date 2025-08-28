import { signIn } from "@/lib/auth"

async function testAuth() {
  try {
    console.log('Testing authentication...')
    
    const result = await signIn("credentials", {
      email: "admin@affiflow.com",
      password: "admin123",
      redirect: false
    })
    
    console.log('Auth result:', result)
    
  } catch (error) {
    console.error('Auth error:', error)
  }
}

testAuth()
